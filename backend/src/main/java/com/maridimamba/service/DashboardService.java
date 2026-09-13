package com.maridimamba.service;

import com.maridimamba.dto.DashboardDto;
import com.maridimamba.dto.LoanDto;
import com.maridimamba.entity.MonthlyCycle;
import com.maridimamba.enums.CycleStatus;
import com.maridimamba.enums.LoanStatus;
import com.maridimamba.repository.LoanRepository;
import com.maridimamba.repository.MemberRepository;
import com.maridimamba.repository.MonthlyCycleRepository;
import com.maridimamba.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class DashboardService {

    private final LedgerService ledgerService;
    private final MemberRepository memberRepository;
    private final MonthlyCycleRepository cycleRepository;
    private final LoanRepository loanRepository;
    private final PaymentRepository paymentRepository;
    private final LoanService loanService;

    public DashboardDto getDashboardData() {
        BigDecimal cashInHand = ledgerService.getCurrentGroupBalance();

        Optional<MonthlyCycle> activeCycleOpt = cycleRepository.findTopByStatusOrderByMonthDateDesc(CycleStatus.OPEN);

        BigDecimal currentlyLent = BigDecimal.ZERO;
        BigDecimal reservePool = BigDecimal.ZERO;
        BigDecimal expectedRepayment = BigDecimal.ZERO;
        BigDecimal totalCollected = BigDecimal.ZERO;
        BigDecimal outstandingAmount = BigDecimal.ZERO;
        Long cycleId = null;
        String cycleName = "No Active Month";
        String cycleStatus = "NONE";
        List<LoanDto> activeLoans = Collections.emptyList();

        if (activeCycleOpt.isPresent()) {
            MonthlyCycle cycle = activeCycleOpt.get();
            cycleId = cycle.getId();
            cycleName = cycle.getCycleName();
            cycleStatus = cycle.getStatus().name();
            reservePool = cycle.getReserveAmount();
            currentlyLent = cycle.getLendingAmount();

            expectedRepayment = loanRepository.sumTotalDueByCycleId(cycleId);
            totalCollected = paymentRepository.sumTotalPaymentsByCycleId(cycleId);
            outstandingAmount = loanRepository.sumRemainingAmountByCycleId(cycleId);
            activeLoans = loanService.getLoansForCycle(cycleId);
        }

        // Total interest accumulated across entire group history
        BigDecimal totalInterestEarned = paymentRepository.findAll().stream()
                .map(p -> p.getInterestPortion() != null ? p.getInterestPortion() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long activeMembers = memberRepository.countByActiveTrue();
        long totalMembers = memberRepository.count();

        long activeLoansCount = activeLoans.size();
        long pendingLoansCount = activeLoans.stream()
                .filter(l -> l.getStatus() == LoanStatus.PENDING || l.getStatus() == LoanStatus.PARTIALLY_PAID)
                .count();
        long overdueLoansCount = activeLoans.stream()
                .filter(l -> l.getStatus() == LoanStatus.OVERDUE)
                .count();

        // Total group wealth = Cash in Hand + Total Outstanding Receivables across all loans
        BigDecimal totalReceivables = loanRepository.findAll().stream()
                .filter(l -> l.getStatus() != LoanStatus.PAID)
                .map(l -> l.getRemainingAmount() != null ? l.getRemainingAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalGroupWealth = cashInHand.add(totalReceivables);

        return DashboardDto.builder()
                .groupBalance(cashInHand)
                .currentlyLent(currentlyLent)
                .reservePool(reservePool)
                .interestEarned(totalInterestEarned)
                .totalGroupWealth(totalGroupWealth)
                .activeMembersCount(activeMembers)
                .totalMembersCount(totalMembers)
                .activeLoansCount(activeLoansCount)
                .pendingLoansCount(pendingLoansCount)
                .overdueLoansCount(overdueLoansCount)
                .currentCycleId(cycleId)
                .currentCycleName(cycleName)
                .currentCycleStatus(cycleStatus)
                .expectedRepayment(expectedRepayment)
                .totalCollected(totalCollected)
                .outstandingAmount(outstandingAmount)
                .activeLoans(activeLoans)
                .recentTransactions(ledgerService.getAllTransactions().stream().limit(10).collect(Collectors.toList()))
                .build();
    }
}
