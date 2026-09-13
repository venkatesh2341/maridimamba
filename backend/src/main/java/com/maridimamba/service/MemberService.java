package com.maridimamba.service;

import com.maridimamba.dto.MemberCreateRequest;
import com.maridimamba.dto.MemberDetailDto;
import com.maridimamba.dto.MemberDto;
import com.maridimamba.entity.Member;
import com.maridimamba.exception.ResourceNotFoundException;
import com.maridimamba.repository.LoanRepository;
import com.maridimamba.repository.MemberRepository;
import com.maridimamba.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final LoanRepository loanRepository;
    private final PaymentRepository paymentRepository;
    private final AuditService auditService;
    private final LoanService loanService;
    private final PaymentService paymentService;

    public List<MemberDto> getAllMembers() {
        return memberRepository.findAllByOrderByActiveDescNameAsc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<MemberDto> getActiveMembers() {
        return memberRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public MemberDto getMemberById(Long id) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found with id: " + id));
        return mapToDto(member);
    }

    public MemberDetailDto getMemberDetails(Long id) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found with id: " + id));

        BigDecimal totalBorrowed = loanRepository.sumPrincipalByMemberId(id);
        BigDecimal totalRepaid = loanRepository.sumAmountPaidByMemberId(id);
        BigDecimal outstanding = loanRepository.sumRemainingByMemberId(id);
        BigDecimal interestPaid = paymentRepository.sumInterestPaymentsByMemberId(id);
        long loanCount = loanRepository.findByMemberIdOrderByDueDateDesc(id).size();

        return MemberDetailDto.builder()
                .member(mapToDto(member))
                .totalBorrowed(totalBorrowed)
                .totalRepaid(totalRepaid)
                .totalInterestPaid(interestPaid)
                .outstandingAmount(outstanding)
                .numberOfLoans(loanCount)
                .loanHistory(loanService.getLoansForMember(id))
                .paymentHistory(paymentService.getPaymentsForMember(id))
                .build();
    }

    @Transactional
    public MemberDto createMember(MemberCreateRequest request) {
        Member member = Member.builder()
                .name(request.getName().trim())
                .phone(request.getPhone().trim())
                .address(request.getAddress() != null ? request.getAddress().trim() : null)
                .notes(request.getNotes() != null ? request.getNotes().trim() : null)
                .active(true)
                .build();

        Member saved = memberRepository.save(member);
        auditService.logAction("CREATE_MEMBER", "MEMBER", saved.getId().toString(), null, "Created member " + saved.getName());
        return mapToDto(saved);
    }

    @Transactional
    public MemberDto updateMember(Long id, MemberCreateRequest request) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found with id: " + id));

        String oldVal = member.getName() + ", " + member.getPhone();
        member.setName(request.getName().trim());
        member.setPhone(request.getPhone().trim());
        member.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        member.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);

        Member updated = memberRepository.save(member);
        auditService.logAction("UPDATE_MEMBER", "MEMBER", id.toString(), oldVal, updated.getName() + ", " + updated.getPhone());
        return mapToDto(updated);
    }

    @Transactional
    public MemberDto toggleMemberStatus(Long id, boolean active) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found with id: " + id));

        boolean oldStatus = member.isActive();
        member.setActive(active);
        Member updated = memberRepository.save(member);

        auditService.logAction("TOGGLE_MEMBER_STATUS", "MEMBER", id.toString(),
                "Active: " + oldStatus, "Active: " + active);
        return mapToDto(updated);
    }

    public MemberDto mapToDto(Member member) {
        return MemberDto.builder()
                .id(member.getId())
                .name(member.getName())
                .phone(member.getPhone())
                .address(member.getAddress())
                .active(member.isActive())
                .notes(member.getNotes())
                .createdAt(member.getCreatedAt())
                .updatedAt(member.getUpdatedAt())
                .build();
    }
}
