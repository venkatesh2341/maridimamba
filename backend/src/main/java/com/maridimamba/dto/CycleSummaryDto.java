package com.maridimamba.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CycleSummaryDto {
    private Long cycleId;
    private String cycleName;
    private BigDecimal openingBalance;
    private BigDecimal lendingAmount;
    private BigDecimal reserveAmount;
    private BigDecimal expectedRepayment;
    private BigDecimal expectedInterest;
    private BigDecimal actualAmountReceived;
    private BigDecimal actualInterestReceived;
    private BigDecimal outstandingAmount;
    private BigDecimal closingBalance;
    private long totalLoansCount;
    private long paidLoansCount;
    private long unpaidLoansCount;
    private List<LoanDto> unpaidLoans;
}
