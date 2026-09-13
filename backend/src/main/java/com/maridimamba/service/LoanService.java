package com.maridimamba.service;

import com.maridimamba.dto.ChunkAssignItem;
import com.maridimamba.dto.ChunkAssignRequest;
import com.maridimamba.dto.LoanDto;
import com.maridimamba.entity.Loan;
import com.maridimamba.entity.Member;
import com.maridimamba.entity.MonthlyCycle;
import com.maridimamba.enums.CycleStatus;
import com.maridimamba.enums.LoanStatus;
import com.maridimamba.enums.ReferenceType;
import com.maridimamba.enums.TransactionType;
import com.maridimamba.exception.BusinessRuleException;
import com.maridimamba.exception.ResourceNotFoundException;
import com.maridimamba.repository.LoanRepository;
import com.maridimamba.repository.MemberRepository;
import com.maridimamba.repository.MonthlyCycleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoanService {

    private final LoanRepository loanRepository;
    private final MemberRepository memberRepository;
    private final MonthlyCycleRepository cycleRepository;
    private final LedgerService ledgerService;
    private final AuditService auditService;

    public List<LoanDto> getLoansForCycle(Long cycleId) {
        return loanRepository.findByCycleIdOrderByChunkNumberAsc(cycleId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<LoanDto> getLoansForMember(Long memberId) {
        return loanRepository.findByMemberIdOrderByDueDateDesc(memberId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<LoanDto> getAllLoans(LoanStatus status) {
        List<Loan> loans = (status != null) ? loanRepository.findByStatus(status) : loanRepository.findAllByOrderByCreatedAtDesc();
        return loans.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public LoanDto getLoanById(Long id) {
        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with id: " + id));
        return mapToDto(loan);
    }

    public List<com.maridimamba.dto.MemberDto> getEligibleMembersForCycle(Long cycleId) {
        List<Long> assignedMemberIds = loanRepository.findMemberIdsByCycleId(cycleId);
        return memberRepository.findByActiveTrueOrderByNameAsc().stream()
                .filter(m -> !assignedMemberIds.contains(m.getId()))
                .map(m -> com.maridimamba.dto.MemberDto.builder()
                        .id(m.getId())
                        .name(m.getName())
                        .phone(m.getPhone())
                        .address(m.getAddress())
                        .active(m.isActive())
                        .notes(m.getNotes())
                        .createdAt(m.getCreatedAt())
                        .updatedAt(m.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public List<LoanDto> assignChunks(Long cycleId, ChunkAssignRequest request) {
        MonthlyCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new ResourceNotFoundException("Cycle not found with id: " + cycleId));

        if (cycle.getStatus() != CycleStatus.OPEN) {
            throw new BusinessRuleException("Loans can only be assigned to an OPEN monthly cycle");
        }

        // Validate total principal chunks don't exceed lending amount
        BigDecimal totalRequestedPrincipal = request.getChunks().stream()
                .map(ChunkAssignItem::getPrincipalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalRequestedPrincipal.compareTo(cycle.getLendingAmount()) > 0) {
            throw new BusinessRuleException("Total principal assigned (" + totalRequestedPrincipal +
                    ") exceeds cycle lending amount (" + cycle.getLendingAmount() + ")");
        }

        // Rule: A member cannot take more than one chunk of loan in a single month
        java.util.Set<Long> memberIdsInRequest = new java.util.HashSet<>();
        for (ChunkAssignItem item : request.getChunks()) {
            if (!memberIdsInRequest.add(item.getMemberId())) {
                Member member = memberRepository.findById(item.getMemberId()).orElse(null);
                String name = member != null ? member.getName() : "ID " + item.getMemberId();
                throw new BusinessRuleException("Member '" + name +
                        "' is assigned multiple chunks in this cycle. Under village rules, a person cannot take more than one chunk of money as loan in a single month.");
            }
        }

        String username = getUsername();
        List<Loan> createdLoans = new ArrayList<>();

        for (ChunkAssignItem item : request.getChunks()) {
            Member member = memberRepository.findById(item.getMemberId())
                    .orElseThrow(() -> new ResourceNotFoundException("Member not found with id: " + item.getMemberId()));

            if (!member.isActive()) {
                throw new BusinessRuleException("Cannot allocate chunk to inactive member: " + member.getName());
            }

            // Check if member already has a loan in this cycle
            if (loanRepository.existsByCycleIdAndMemberId(cycleId, item.getMemberId())) {
                throw new BusinessRuleException("Member '" + member.getName() +
                        "' has already taken a chunk in this month's cycle (" + cycle.getCycleName() +
                        "). Under village rules, one person cannot take more than one chunk per month.");
            }

            BigDecimal principal = item.getPrincipalAmount();
            BigDecimal interest = item.getInterestAmount();
            BigDecimal totalDue = principal.add(interest);

            Loan loan = Loan.builder()
                    .cycle(cycle)
                    .member(member)
                    .chunkNumber(item.getChunkNumber())
                    .principalAmount(principal)
                    .interestAmount(interest)
                    .totalDue(totalDue)
                    .amountPaid(BigDecimal.ZERO)
                    .remainingAmount(totalDue)
                    .dueDate(item.getDueDate() != null ? item.getDueDate() : cycle.getEndDate())
                    .status(LoanStatus.PENDING)
                    .notes(item.getNotes())
                    .build();

            Loan saved = loanRepository.save(loan);
            createdLoans.add(saved);

            // Record Loan Disbursement in the Ledger (cash outflow)
            ledgerService.recordTransaction(
                    cycle,
                    TransactionType.LOAN_DISBURSEMENT,
                    principal.negate(),
                    ReferenceType.LOAN,
                    saved.getId(),
                    "Disbursed Chunk #" + saved.getChunkNumber() + " (₹" + principal +
                            ") to " + member.getName() + " (Auction Winning Interest: ₹" + interest + ")",
                    username
            );

            // Audit
            auditService.logAction("AUCTION_CHUNK_ALLOCATED", "LOAN", saved.getId().toString(),
                    null, "Allocated chunk #" + saved.getChunkNumber() + " to " + member.getName() +
                            " - Principal: ₹" + principal + ", Auction Interest: ₹" + interest);
        }

        return createdLoans.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public void checkAndUpdateOverdueLoans() {
        LocalDate today = LocalDate.now();
        List<Loan> pendingLoans = loanRepository.findAll();
        for (Loan loan : pendingLoans) {
            if (loan.getStatus() != LoanStatus.PAID && loan.getDueDate().isBefore(today)) {
                loan.setStatus(LoanStatus.OVERDUE);
                loanRepository.save(loan);
            }
        }
    }

    private String getUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.isAuthenticated() && auth.getName() != null) ? auth.getName() : "leader";
    }

    public LoanDto mapToDto(Loan loan) {
        return LoanDto.builder()
                .id(loan.getId())
                .cycleId(loan.getCycle().getId())
                .cycleName(loan.getCycle().getCycleName())
                .memberId(loan.getMember().getId())
                .memberName(loan.getMember().getName())
                .memberPhone(loan.getMember().getPhone())
                .chunkNumber(loan.getChunkNumber())
                .principalAmount(loan.getPrincipalAmount())
                .interestAmount(loan.getInterestAmount())
                .totalDue(loan.getTotalDue())
                .amountPaid(loan.getAmountPaid())
                .remainingAmount(loan.getRemainingAmount())
                .dueDate(loan.getDueDate())
                .status(loan.getStatus())
                .notes(loan.getNotes())
                .createdAt(loan.getCreatedAt())
                .updatedAt(loan.getUpdatedAt())
                .build();
    }
}
