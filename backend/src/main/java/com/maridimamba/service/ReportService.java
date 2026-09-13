package com.maridimamba.service;

import com.maridimamba.dto.MemberLoanReportItem;
import com.maridimamba.dto.MonthlyReportDto;
import com.maridimamba.entity.Loan;
import com.maridimamba.entity.MonthlyCycle;
import com.maridimamba.exception.ResourceNotFoundException;
import com.maridimamba.repository.LoanRepository;
import com.maridimamba.repository.MonthlyCycleRepository;
import com.maridimamba.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final MonthlyCycleRepository cycleRepository;
    private final LoanRepository loanRepository;
    private final PaymentRepository paymentRepository;

    public MonthlyReportDto getMonthlyReport(Long cycleId) {
        MonthlyCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new ResourceNotFoundException("Cycle not found with id: " + cycleId));

        BigDecimal expectedPrincipal = loanRepository.sumPrincipalByCycleId(cycleId);
        BigDecimal expectedInterest = loanRepository.sumInterestByCycleId(cycleId);
        BigDecimal expectedTotal = loanRepository.sumTotalDueByCycleId(cycleId);

        BigDecimal actualPrincipal = paymentRepository.sumPrincipalPortionByCycleId(cycleId);
        BigDecimal actualInterest = paymentRepository.sumInterestPortionByCycleId(cycleId);
        BigDecimal actualTotal = paymentRepository.sumTotalPaymentsByCycleId(cycleId);

        BigDecimal outstanding = loanRepository.sumRemainingAmountByCycleId(cycleId);

        List<Loan> loans = loanRepository.findByCycleIdOrderByChunkNumberAsc(cycleId);
        List<MemberLoanReportItem> memberLoans = loans.stream().map(loan -> MemberLoanReportItem.builder()
                .chunkNumber(loan.getChunkNumber())
                .loanId(loan.getId())
                .memberId(loan.getMember().getId())
                .memberName(loan.getMember().getName())
                .memberPhone(loan.getMember().getPhone())
                .principalAmount(loan.getPrincipalAmount())
                .interestAmount(loan.getInterestAmount())
                .totalDue(loan.getTotalDue())
                .amountPaid(loan.getAmountPaid())
                .remainingAmount(loan.getRemainingAmount())
                .dueDate(loan.getDueDate())
                .status(loan.getStatus())
                .build()).collect(Collectors.toList());

        return MonthlyReportDto.builder()
                .cycleId(cycle.getId())
                .cycleName(cycle.getCycleName())
                .monthDate(cycle.getMonthDate().toString())
                .status(cycle.getStatus().name())
                .openingBalance(cycle.getOpeningBalance())
                .amountLent(cycle.getLendingAmount())
                .reserveAmount(cycle.getReserveAmount())
                .expectedPrincipal(expectedPrincipal)
                .expectedInterest(expectedInterest)
                .expectedTotal(expectedTotal)
                .actualPrincipalCollected(actualPrincipal)
                .actualInterestCollected(actualInterest)
                .totalAmountCollected(actualTotal)
                .outstandingAmount(outstanding)
                .closingBalance(cycle.getClosingBalance())
                .memberLoans(memberLoans)
                .build();
    }

    public String generateCsvReport(Long cycleId) {
        MonthlyReportDto report = getMonthlyReport(cycleId);
        StringBuilder csv = new StringBuilder();

        csv.append("Village Group Money Pool - Monthly Report\n");
        csv.append("Cycle:,").append(report.getCycleName()).append("\n");
        csv.append("Status:,").append(report.getStatus()).append("\n");
        csv.append("Opening Balance:,₹").append(report.getOpeningBalance()).append("\n");
        csv.append("Amount Lent:,₹").append(report.getAmountLent()).append("\n");
        csv.append("Reserve Kept:,₹").append(report.getReserveAmount()).append("\n");
        csv.append("Expected Principal:,₹").append(report.getExpectedPrincipal()).append("\n");
        csv.append("Expected Interest:,₹").append(report.getExpectedInterest()).append("\n");
        csv.append("Expected Total:,₹").append(report.getExpectedTotal()).append("\n");
        csv.append("Actual Principal Collected:,₹").append(report.getActualPrincipalCollected()).append("\n");
        csv.append("Actual Interest Collected:,₹").append(report.getActualInterestCollected()).append("\n");
        csv.append("Total Collected:,₹").append(report.getTotalAmountCollected()).append("\n");
        csv.append("Outstanding Balance:,₹").append(report.getOutstandingAmount()).append("\n\n");

        csv.append("Chunk,Member Name,Phone,Principal,Interest,Total Due,Paid,Remaining,Status,Due Date\n");
        for (MemberLoanReportItem item : report.getMemberLoans()) {
            csv.append(item.getChunkNumber()).append(",")
                    .append("\"").append(item.getMemberName()).append("\",")
                    .append(item.getMemberPhone()).append(",")
                    .append(item.getPrincipalAmount()).append(",")
                    .append(item.getInterestAmount()).append(",")
                    .append(item.getTotalDue()).append(",")
                    .append(item.getAmountPaid()).append(",")
                    .append(item.getRemainingAmount()).append(",")
                    .append(item.getStatus()).append(",")
                    .append(item.getDueDate()).append("\n");
        }

        return csv.toString();
    }
}
