package com.maridimamba.service;

import com.maridimamba.dto.CycleCloseRequest;
import com.maridimamba.dto.CycleCreateRequest;
import com.maridimamba.dto.CycleDto;
import com.maridimamba.dto.CycleSummaryDto;
import com.maridimamba.entity.Loan;
import com.maridimamba.entity.MonthlyCycle;
import com.maridimamba.enums.CycleStatus;
import com.maridimamba.enums.LoanStatus;
import com.maridimamba.exception.BusinessRuleException;
import com.maridimamba.exception.ResourceNotFoundException;
import com.maridimamba.repository.LoanRepository;
import com.maridimamba.repository.MonthlyCycleRepository;
import com.maridimamba.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CycleService {

    private final MonthlyCycleRepository cycleRepository;
    private final LoanRepository loanRepository;
    private final PaymentRepository paymentRepository;
    private final LedgerService ledgerService;
    private final AuditService auditService;
    private final LoanService loanService;

    public List<CycleDto> getAllCycles() {
        return cycleRepository.findAllByOrderByMonthDateDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public Optional<CycleDto> getActiveCycle() {
        return cycleRepository.findTopByStatusOrderByMonthDateDesc(CycleStatus.OPEN)
                .map(this::mapToDto);
    }

    public CycleDto getCycleById(Long id) {
        MonthlyCycle cycle = cycleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cycle not found with id: " + id));
        return mapToDto(cycle);
    }

    public BigDecimal getAvailableBalanceForNewCycle() {
        BigDecimal ledgerBalance = ledgerService.getCurrentGroupBalance();
        if (ledgerBalance != null && ledgerBalance.compareTo(BigDecimal.ZERO) > 0) {
            return ledgerBalance;
        }
        Optional<MonthlyCycle> lastClosed = cycleRepository.findTopByStatusOrderByClosedAtDesc(CycleStatus.CLOSED);
        if (lastClosed.isPresent() && lastClosed.get().getClosingBalance() != null) {
            return lastClosed.get().getClosingBalance();
        }
        return new BigDecimal("50000.00");
    }

    @Transactional
    public CycleDto createCycle(CycleCreateRequest request) {
        // Rule: Only one open cycle at a time
        if (cycleRepository.existsByStatus(CycleStatus.OPEN)) {
            throw new BusinessRuleException("An active cycle is already OPEN. Please close the current cycle before starting a new one.");
        }

        BigDecimal availableBalance = getAvailableBalanceForNewCycle();
        BigDecimal lendingAmount = request.getLendingAmount();

        // Rule: Lending amount cannot exceed group balance
        if (lendingAmount.compareTo(availableBalance) > 0) {
            throw new BusinessRuleException("Lending amount (₹" + lendingAmount +
                    ") cannot exceed available group balance (₹" + availableBalance + ")");
        }

        // Rule: Reserve = Available Balance - Lending Amount
        BigDecimal reserveAmount = availableBalance.subtract(lendingAmount);

        // Calculate Chunks
        BigDecimal chunkAmount = request.getChunkAmount();
        int numberOfChunks = 0;
        if (request.getNumberOfChunks() != null && request.getNumberOfChunks() > 0) {
            numberOfChunks = request.getNumberOfChunks();
        } else if (chunkAmount != null && chunkAmount.compareTo(BigDecimal.ZERO) > 0) {
            numberOfChunks = lendingAmount.divide(chunkAmount, 0, RoundingMode.DOWN).intValue();
        }

        String chunkBreakdown = request.getChunkBreakdown();
        if (chunkBreakdown == null || chunkBreakdown.isBlank()) {
            if (chunkAmount != null && numberOfChunks > 0) {
                chunkBreakdown = numberOfChunks + "x ₹" + chunkAmount.intValue();
            }
        }

        MonthlyCycle cycle = MonthlyCycle.builder()
                .cycleName(request.getCycleName().trim())
                .monthDate(request.getMonthDate())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .openingBalance(availableBalance)
                .lendingAmount(lendingAmount)
                .reserveAmount(reserveAmount)
                .chunkAmount(chunkAmount)
                .chunkBreakdown(chunkBreakdown)
                .numberOfChunks(numberOfChunks)
                .status(CycleStatus.OPEN)
                .notes(request.getNotes())
                .build();

        MonthlyCycle saved = cycleRepository.save(cycle);

        auditService.logAction("CREATE_CYCLE", "MONTHLY_CYCLE", saved.getId().toString(),
                null, "Created cycle " + saved.getCycleName() + ": Opening ₹" + availableBalance +
                        ", Lent ₹" + lendingAmount + ", Reserve ₹" + reserveAmount + " (" + numberOfChunks + " chunks: " + chunkBreakdown + ")");

        return mapToDto(saved);
    }

    public CycleSummaryDto getCycleCloseSummary(Long cycleId) {
        MonthlyCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new ResourceNotFoundException("Cycle not found with id: " + cycleId));

        BigDecimal expectedRepayment = loanRepository.sumTotalDueByCycleId(cycleId);
        BigDecimal expectedInterest = loanRepository.sumInterestByCycleId(cycleId);
        BigDecimal actualReceived = paymentRepository.sumTotalPaymentsByCycleId(cycleId);
        BigDecimal actualInterest = paymentRepository.sumInterestPortionByCycleId(cycleId);
        BigDecimal outstanding = loanRepository.sumRemainingAmountByCycleId(cycleId);

        // Total cash = Reserve + Actual payments received in this cycle
        BigDecimal closingBalance = cycle.getReserveAmount().add(actualReceived);

        long totalLoans = loanRepository.countByCycleId(cycleId);
        long paidLoans = loanRepository.countByCycleIdAndStatus(cycleId, LoanStatus.PAID);
        long unpaidLoans = totalLoans - paidLoans;

        List<Loan> unpaids = loanRepository.findByCycleIdOrderByChunkNumberAsc(cycleId).stream()
                .filter(l -> l.getStatus() != LoanStatus.PAID)
                .collect(Collectors.toList());

        return CycleSummaryDto.builder()
                .cycleId(cycle.getId())
                .cycleName(cycle.getCycleName())
                .openingBalance(cycle.getOpeningBalance())
                .lendingAmount(cycle.getLendingAmount())
                .reserveAmount(cycle.getReserveAmount())
                .expectedRepayment(expectedRepayment)
                .expectedInterest(expectedInterest)
                .actualAmountReceived(actualReceived)
                .actualInterestReceived(actualInterest)
                .outstandingAmount(outstanding)
                .closingBalance(closingBalance)
                .totalLoansCount(totalLoans)
                .paidLoansCount(paidLoans)
                .unpaidLoansCount(unpaidLoans)
                .unpaidLoans(unpaids.stream().map(loanService::mapToDto).collect(Collectors.toList()))
                .build();
    }

    @Transactional
    public CycleDto closeCycle(Long cycleId, CycleCloseRequest request) {
        MonthlyCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new ResourceNotFoundException("Cycle not found with id: " + cycleId));

        if (cycle.getStatus() == CycleStatus.CLOSED) {
            throw new BusinessRuleException("Cycle is already CLOSED");
        }

        long unpaidLoans = loanRepository.countUnpaidLoansInCycle(cycleId);
        if (unpaidLoans > 0 && !request.isConfirmWithUnpaidLoans()) {
            throw new BusinessRuleException("Cycle has " + unpaidLoans + " unpaid loan(s). Confirmation is required to close.");
        }

        // Calculate closing balance: Reserve + actual repayments received
        BigDecimal actualReceived = paymentRepository.sumTotalPaymentsByCycleId(cycleId);
        BigDecimal closingBalance = cycle.getReserveAmount().add(actualReceived);

        cycle.setClosingBalance(closingBalance);
        cycle.setStatus(CycleStatus.CLOSED);
        cycle.setClosedAt(LocalDateTime.now());
        if (request.getNotes() != null) {
            cycle.setNotes(cycle.getNotes() != null ? cycle.getNotes() + "\n" + request.getNotes() : request.getNotes());
        }

        MonthlyCycle saved = cycleRepository.save(cycle);

        auditService.logAction("CLOSE_CYCLE", "MONTHLY_CYCLE", saved.getId().toString(),
                "OPEN", "CLOSED with closing balance ₹" + closingBalance + " (Unpaid loans: " + unpaidLoans + ")");

        return mapToDto(saved);
    }

    public CycleDto mapToDto(MonthlyCycle cycle) {
        Long cycleId = cycle.getId();
        BigDecimal totalLent = loanRepository.sumPrincipalByCycleId(cycleId);
        BigDecimal expectedRepayment = loanRepository.sumTotalDueByCycleId(cycleId);
        BigDecimal expectedInterest = loanRepository.sumInterestByCycleId(cycleId);
        BigDecimal actualReceived = paymentRepository.sumTotalPaymentsByCycleId(cycleId);
        BigDecimal actualInterest = paymentRepository.sumInterestPortionByCycleId(cycleId);
        BigDecimal outstanding = loanRepository.sumRemainingAmountByCycleId(cycleId);
        long totalLoans = loanRepository.countByCycleId(cycleId);
        long paidLoans = loanRepository.countByCycleIdAndStatus(cycleId, LoanStatus.PAID);
        long pendingLoans = totalLoans - paidLoans;

        return CycleDto.builder()
                .id(cycle.getId())
                .cycleName(cycle.getCycleName())
                .monthDate(cycle.getMonthDate())
                .startDate(cycle.getStartDate())
                .endDate(cycle.getEndDate())
                .openingBalance(cycle.getOpeningBalance())
                .lendingAmount(cycle.getLendingAmount())
                .reserveAmount(cycle.getReserveAmount())
                .chunkAmount(cycle.getChunkAmount())
                .chunkBreakdown(cycle.getChunkBreakdown())
                .numberOfChunks(cycle.getNumberOfChunks())
                .closingBalance(cycle.getClosingBalance())
                .status(cycle.getStatus())
                .notes(cycle.getNotes())
                .createdAt(cycle.getCreatedAt())
                .closedAt(cycle.getClosedAt())
                .totalLent(totalLent)
                .expectedRepayment(expectedRepayment)
                .expectedInterest(expectedInterest)
                .actualRepaymentReceived(actualReceived)
                .actualInterestReceived(actualInterest)
                .outstandingAmount(outstanding)
                .totalLoans(totalLoans)
                .paidLoans(paidLoans)
                .pendingLoans(pendingLoans)
                .build();
    }
}
