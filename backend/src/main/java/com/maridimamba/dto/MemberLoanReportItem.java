package com.maridimamba.dto;

import com.maridimamba.enums.LoanStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberLoanReportItem {
    private Integer chunkNumber;
    private Long loanId;
    private Long memberId;
    private String memberName;
    private String memberPhone;
    private BigDecimal principalAmount;
    private BigDecimal interestAmount;
    private BigDecimal totalDue;
    private BigDecimal amountPaid;
    private BigDecimal remainingAmount;
    private LocalDate dueDate;
    private LoanStatus status;
}
