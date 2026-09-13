package com.maridimamba.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardDto {
    // Primary 4 Cards
    private BigDecimal groupBalance;       // Cash in hand from ledger
    private BigDecimal currentlyLent;      // Total principal actively out
    private BigDecimal reservePool;        // Cash reserved from active cycle
    private BigDecimal interestEarned;     // Total interest accumulated

    // Overall Group Metrics
    private BigDecimal totalGroupWealth;   // Liquid cash + total outstanding receivables
    private long activeMembersCount;
    private long totalMembersCount;
    private long activeLoansCount;
    private long pendingLoansCount;
    private long overdueLoansCount;

    // Active Cycle Figures
    private Long currentCycleId;
    private String currentCycleName;
    private String currentCycleStatus;
    private BigDecimal expectedRepayment;
    private BigDecimal totalCollected;
    private BigDecimal outstandingAmount;

    // Quick Activity Feeds
    private List<LoanDto> activeLoans;
    private List<LedgerTransactionDto> recentTransactions;
}
