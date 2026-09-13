package com.maridimamba.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberDetailDto {
    private MemberDto member;
    private BigDecimal totalBorrowed;
    private BigDecimal totalRepaid;
    private BigDecimal totalInterestPaid;
    private BigDecimal outstandingAmount;
    private long numberOfLoans;
    private List<LoanDto> loanHistory;
    private List<PaymentDto> paymentHistory;
}
