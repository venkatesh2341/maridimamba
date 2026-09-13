package com.maridimamba.service;

import com.maridimamba.dto.PaymentCreateRequest;
import com.maridimamba.dto.PaymentDto;
import com.maridimamba.entity.Loan;
import com.maridimamba.entity.Payment;
import com.maridimamba.enums.LoanStatus;
import com.maridimamba.enums.ReferenceType;
import com.maridimamba.enums.TransactionType;
import com.maridimamba.exception.BusinessRuleException;
import com.maridimamba.exception.ResourceNotFoundException;
import com.maridimamba.repository.LoanRepository;
import com.maridimamba.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final LoanRepository loanRepository;
    private final LedgerService ledgerService;
    private final AuditService auditService;

    @Transactional
    public PaymentDto recordPayment(Long loanId, PaymentCreateRequest request) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with id: " + loanId));

        if (loan.getStatus() == LoanStatus.PAID) {
            throw new BusinessRuleException("Loan is already fully PAID");
        }

        BigDecimal paymentAmount = request.getAmount();
        if (paymentAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Payment amount must be greater than zero");
        }

        if (paymentAmount.compareTo(loan.getRemainingAmount()) > 0) {
            throw new BusinessRuleException("Payment amount (₹" + paymentAmount +
                    ") cannot exceed remaining loan balance (₹" + loan.getRemainingAmount() + ")");
        }

        String username = getUsername();
        String oldStatus = loan.getStatus().name();
        BigDecimal oldRemaining = loan.getRemainingAmount();

        // Calculate principal vs interest breakdown
        BigDecimal principalPortion = request.getPrincipalPortion();
        BigDecimal interestPortion = request.getInterestPortion();

        if (principalPortion == null || interestPortion == null) {
            // Default split: fill principal first, then interest
            BigDecimal principalAlreadyPaid = loan.getAmountPaid().min(loan.getPrincipalAmount());
            BigDecimal principalRemaining = loan.getPrincipalAmount().subtract(principalAlreadyPaid);

            if (paymentAmount.compareTo(principalRemaining) <= 0) {
                principalPortion = paymentAmount;
                interestPortion = BigDecimal.ZERO;
            } else {
                principalPortion = principalRemaining;
                interestPortion = paymentAmount.subtract(principalRemaining);
            }
        }

        // Update Loan
        BigDecimal newAmountPaid = loan.getAmountPaid().add(paymentAmount);
        BigDecimal newRemaining = loan.getTotalDue().subtract(newAmountPaid);
        loan.setAmountPaid(newAmountPaid);
        loan.setRemainingAmount(newRemaining);

        if (newRemaining.compareTo(BigDecimal.ZERO) == 0) {
            loan.setStatus(LoanStatus.PAID);
        } else {
            loan.setStatus(LoanStatus.PARTIALLY_PAID);
        }
        loanRepository.save(loan);

        // Save Payment record
        LocalDateTime paymentTime = request.getPaymentDate() != null ? request.getPaymentDate() : LocalDateTime.now();
        Payment payment = Payment.builder()
                .loan(loan)
                .member(loan.getMember())
                .cycle(loan.getCycle())
                .amount(paymentAmount)
                .principalPortion(principalPortion)
                .interestPortion(interestPortion)
                .paymentDate(paymentTime)
                .recordedBy(username)
                .notes(request.getNotes())
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        // Credit to Ledger (Cash inflow to group)
        ledgerService.recordTransaction(
                loan.getCycle(),
                TransactionType.LOAN_REPAYMENT,
                paymentAmount,
                ReferenceType.PAYMENT,
                savedPayment.getId(),
                "Repayment received from " + loan.getMember().getName() + " for Chunk #" + loan.getChunkNumber() +
                        " (Principal: ₹" + principalPortion + ", Interest: ₹" + interestPortion + ")",
                username
        );

        // Audit log
        auditService.logAction("RECORD_PAYMENT", "PAYMENT", savedPayment.getId().toString(),
                "Status: " + oldStatus + ", Remaining: ₹" + oldRemaining,
                "Paid: ₹" + paymentAmount + ", Status: " + loan.getStatus() + ", Remaining: ₹" + newRemaining);

        return mapToDto(savedPayment);
    }

    public List<PaymentDto> getPaymentsForLoan(Long loanId) {
        return paymentRepository.findByLoanIdOrderByPaymentDateDesc(loanId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<PaymentDto> getPaymentsForMember(Long memberId) {
        return paymentRepository.findByMemberIdOrderByPaymentDateDesc(memberId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<PaymentDto> getPaymentsForCycle(Long cycleId) {
        return paymentRepository.findByCycleIdOrderByPaymentDateDesc(cycleId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<PaymentDto> getAllPayments() {
        return paymentRepository.findAllByOrderByPaymentDateDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private String getUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.isAuthenticated() && auth.getName() != null) ? auth.getName() : "leader";
    }

    public PaymentDto mapToDto(Payment payment) {
        return PaymentDto.builder()
                .id(payment.getId())
                .loanId(payment.getLoan().getId())
                .memberId(payment.getMember().getId())
                .memberName(payment.getMember().getName())
                .cycleId(payment.getCycle().getId())
                .cycleName(payment.getCycle().getCycleName())
                .amount(payment.getAmount())
                .principalPortion(payment.getPrincipalPortion())
                .interestPortion(payment.getInterestPortion())
                .paymentDate(payment.getPaymentDate())
                .recordedBy(payment.getRecordedBy())
                .notes(payment.getNotes())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
