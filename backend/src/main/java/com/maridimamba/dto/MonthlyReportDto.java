package com.maridimamba.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlyReportDto {
    private Long cycleId;
    private String cycleName;
    private String monthDate;
    private String status;
    private BigDecimal openingBalance;
    private BigDecimal amountLent;
    private BigDecimal reserveAmount;
    private BigDecimal expectedPrincipal;
    private BigDecimal expectedInterest;
    private BigDecimal expectedTotal;
    private BigDecimal actualPrincipalCollected;
    private BigDecimal actualInterestCollected;
    private BigDecimal totalAmountCollected;
    private BigDecimal outstandingAmount;
    private BigDecimal closingBalance;
    private List<MemberLoanReportItem> memberLoans;
}
