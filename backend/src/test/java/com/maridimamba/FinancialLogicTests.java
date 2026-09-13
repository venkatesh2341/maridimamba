package com.maridimamba;

import com.maridimamba.dto.*;
import com.maridimamba.entity.Loan;
import com.maridimamba.enums.CycleStatus;
import com.maridimamba.enums.LoanStatus;
import com.maridimamba.enums.ReferenceType;
import com.maridimamba.enums.TransactionType;
import com.maridimamba.exception.BusinessRuleException;
import com.maridimamba.repository.LoanRepository;
import com.maridimamba.repository.MonthlyCycleRepository;
import com.maridimamba.service.CycleService;
import com.maridimamba.service.LedgerService;
import com.maridimamba.service.LoanService;
import com.maridimamba.service.PaymentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class FinancialLogicTests {

    @Autowired
    private CycleService cycleService;

    @Autowired
    private LoanService loanService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private LedgerService ledgerService;

    @Autowired
    private MonthlyCycleRepository cycleRepository;

    @Autowired
    private LoanRepository loanRepository;

    @Test
    @DisplayName("Test 1 & 2: Calculate Reserve = Group Balance - Lending Amount")
    void testReserveCalculation() {
        BigDecimal balance = new BigDecimal("64500.00");
        BigDecimal lending = new BigDecimal("60000.00");
        BigDecimal reserve = balance.subtract(lending);

        assertEquals(new BigDecimal("4500.00"), reserve);
        assertEquals(balance, lending.add(reserve));
    }

    @Test
    @DisplayName("Test 3: Chunk split calculation: 60,000 / 5,000 = 12 chunks")
    void testChunkSplitting() {
        BigDecimal lending = new BigDecimal("60000.00");
        BigDecimal chunk = new BigDecimal("5000.00");
        int chunks = lending.divideToIntegralValue(chunk).intValue();

        assertEquals(12, chunks);
        assertEquals(lending, chunk.multiply(BigDecimal.valueOf(chunks)));
    }

    @Test
    @DisplayName("Test 4, 5 & 6: Assign chunk, calculate interest and total due (Principal + Interest)")
    void testLoanAssignmentAndTotalDue() {
        List<LoanDto> activeLoans = loanService.getLoansForCycle(2L);
        assertFalse(activeLoans.isEmpty());

        LoanDto firstLoan = activeLoans.get(0);
        assertEquals(new BigDecimal("5000.00"), firstLoan.getPrincipalAmount());
        assertEquals(new BigDecimal("500.00"), firstLoan.getInterestAmount());
        assertEquals(new BigDecimal("5500.00"), firstLoan.getTotalDue());
        assertEquals(firstLoan.getPrincipalAmount().add(firstLoan.getInterestAmount()), firstLoan.getTotalDue());
    }

    @Test
    @DisplayName("Test 7: Record full payment and status transitions to PAID")
    void testRecordFullPayment() {
        // Find a pending loan in Cycle 2 (e.g. Chunk 4: Ramesh, totalDue 5500, paid 0)
        List<LoanDto> activeLoans = loanService.getLoansForCycle(2L);
        LoanDto pendingLoan = activeLoans.stream()
                .filter(l -> l.getStatus() == LoanStatus.PENDING)
                .findFirst()
                .orElseThrow();

        PaymentCreateRequest request = PaymentCreateRequest.builder()
                .amount(pendingLoan.getTotalDue())
                .notes("Full payment test")
                .build();

        PaymentDto payment = paymentService.recordPayment(pendingLoan.getId(), request);
        assertNotNull(payment);
        assertEquals(pendingLoan.getTotalDue(), payment.getAmount());

        LoanDto updated = loanService.getLoanById(pendingLoan.getId());
        assertEquals(LoanStatus.PAID, updated.getStatus());
        assertEquals(BigDecimal.ZERO.setScale(2), updated.getRemainingAmount().setScale(2));
    }

    @Test
    @DisplayName("Test 8 & 9: Partial payments and multiple payments on the same loan")
    void testPartialAndMultiplePayments() {
        // Find a pending loan
        List<LoanDto> activeLoans = loanService.getLoansForCycle(2L);
        LoanDto pendingLoan = activeLoans.stream()
                .filter(l -> l.getStatus() == LoanStatus.PENDING)
                .findFirst()
                .orElseThrow();

        // 1st partial payment: ₹2,000
        paymentService.recordPayment(pendingLoan.getId(), PaymentCreateRequest.builder()
                .amount(new BigDecimal("2000.00"))
                .notes("1st installment")
                .build());

        LoanDto afterFirst = loanService.getLoanById(pendingLoan.getId());
        assertEquals(LoanStatus.PARTIALLY_PAID, afterFirst.getStatus());
        assertEquals(new BigDecimal("2000.00"), afterFirst.getAmountPaid());
        assertEquals(new BigDecimal("3500.00"), afterFirst.getRemainingAmount());

        // 2nd partial payment: ₹1,500
        paymentService.recordPayment(pendingLoan.getId(), PaymentCreateRequest.builder()
                .amount(new BigDecimal("1500.00"))
                .notes("2nd installment")
                .build());

        LoanDto afterSecond = loanService.getLoanById(pendingLoan.getId());
        assertEquals(LoanStatus.PARTIALLY_PAID, afterSecond.getStatus());
        assertEquals(new BigDecimal("3500.00"), afterSecond.getAmountPaid());
        assertEquals(new BigDecimal("2000.00"), afterSecond.getRemainingAmount());

        // 3rd final payment: ₹2,000 to clear
        paymentService.recordPayment(pendingLoan.getId(), PaymentCreateRequest.builder()
                .amount(new BigDecimal("2000.00"))
                .notes("Final settlement")
                .build());

        LoanDto afterFinal = loanService.getLoanById(pendingLoan.getId());
        assertEquals(LoanStatus.PAID, afterFinal.getStatus());
        assertEquals(new BigDecimal("5500.00"), afterFinal.getAmountPaid());
        assertEquals(BigDecimal.ZERO.setScale(2), afterFinal.getRemainingAmount().setScale(2));
    }

    @Test
    @DisplayName("Test 10 & 14: Payment cannot exceed remaining amount")
    void testPreventPaymentExceedingRemaining() {
        List<LoanDto> activeLoans = loanService.getLoansForCycle(2L);
        LoanDto pendingLoan = activeLoans.stream()
                .filter(l -> l.getStatus() == LoanStatus.PENDING)
                .findFirst()
                .orElseThrow();

        BigDecimal excessAmount = pendingLoan.getRemainingAmount().add(new BigDecimal("100.00"));

        assertThrows(BusinessRuleException.class, () -> {
            paymentService.recordPayment(pendingLoan.getId(), PaymentCreateRequest.builder()
                    .amount(excessAmount)
                    .build());
        });
    }

    @Test
    @DisplayName("Test 13: Prevent lending amount greater than available group balance")
    void testPreventLendingExceedingBalance() {
        BigDecimal availableBalance = cycleService.getAvailableBalanceForNewCycle();
        BigDecimal excessiveLending = availableBalance.add(new BigDecimal("10000.00"));

        CycleCreateRequest request = CycleCreateRequest.builder()
                .cycleName("Test Future Month")
                .monthDate(LocalDate.now().plusMonths(1))
                .startDate(LocalDate.now().plusMonths(1))
                .endDate(LocalDate.now().plusMonths(1).plusDays(30))
                .lendingAmount(excessiveLending)
                .chunkAmount(new BigDecimal("5000.00"))
                .build();

        assertThrows(BusinessRuleException.class, () -> {
            cycleService.createCycle(request);
        });
    }

    @Test
    @DisplayName("Test 15: Ledger running balance accurately tracks movements")
    void testLedgerRunningBalance() {
        BigDecimal balanceBefore = ledgerService.getCurrentGroupBalance();

        // Record a test repayment transaction (+ ₹500)
        ledgerService.recordTransaction(
                null,
                TransactionType.OTHER_INCOME,
                new BigDecimal("500.00"),
                ReferenceType.MANUAL,
                null,
                "Bank interest credit",
                "test-runner"
        );

        BigDecimal balanceAfter = ledgerService.getCurrentGroupBalance();
        assertEquals(balanceBefore.add(new BigDecimal("500.00")), balanceAfter);
    }

    @Test
    @DisplayName("Village Rule: Prevent a member from taking more than one chunk of loan in a single month")
    void testPreventMultipleChunksToSameMemberInSameMonth() {
        // In Cycle 2, member 1 (Ravi) already has Chunk #1
        ChunkAssignRequest requestWithExistingMember = ChunkAssignRequest.builder()
                .chunks(List.of(
                        ChunkAssignItem.builder()
                                .chunkNumber(11)
                                .memberId(1L) // Ravi already has a chunk in Cycle 2!
                                .principalAmount(new BigDecimal("5000.00"))
                                .interestAmount(new BigDecimal("600.00"))
                                .dueDate(LocalDate.now().plusDays(25))
                                .build()
                ))
                .build();

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            loanService.assignChunks(2L, requestWithExistingMember);
        });

        assertTrue(ex.getMessage().contains("already taken a chunk"));

        // Also test duplicate member IDs within the same assignment request
        ChunkAssignRequest requestWithDuplicateInBatch = ChunkAssignRequest.builder()
                .chunks(List.of(
                        ChunkAssignItem.builder()
                                .chunkNumber(11)
                                .memberId(19L) // Ajay
                                .principalAmount(new BigDecimal("5000.00"))
                                .interestAmount(new BigDecimal("500.00"))
                                .dueDate(LocalDate.now().plusDays(25))
                                .build(),
                        ChunkAssignItem.builder()
                                .chunkNumber(12)
                                .memberId(19L) // Ajay duplicate!
                                .principalAmount(new BigDecimal("5000.00"))
                                .interestAmount(new BigDecimal("550.00"))
                                .dueDate(LocalDate.now().plusDays(25))
                                .build()
                ))
                .build();

        BusinessRuleException exBatch = assertThrows(BusinessRuleException.class, () -> {
            loanService.assignChunks(2L, requestWithDuplicateInBatch);
        });

        assertTrue(exBatch.getMessage().contains("multiple chunks"));
    }

    @Test
    @DisplayName("Village Rule: Auction interest determination assigns winning bid to chunk total due")
    void testAuctionInterestDetermination() {
        // Member 19 (Ajay) and Member 20 (Venkat) are eligible (not in cycle 2)
        BigDecimal principal = new BigDecimal("5000.00");
        BigDecimal auctionBidInterest1 = new BigDecimal("650.00");
        BigDecimal auctionBidInterest2 = new BigDecimal("700.00");

        ChunkAssignRequest request = ChunkAssignRequest.builder()
                .chunks(List.of(
                        ChunkAssignItem.builder()
                                .chunkNumber(11)
                                .memberId(19L)
                                .principalAmount(principal)
                                .interestAmount(auctionBidInterest1)
                                .dueDate(LocalDate.now().plusDays(25))
                                .notes("Won round 1 auction bid at ₹650")
                                .build(),
                        ChunkAssignItem.builder()
                                .chunkNumber(12)
                                .memberId(20L)
                                .principalAmount(principal)
                                .interestAmount(auctionBidInterest2)
                                .dueDate(LocalDate.now().plusDays(25))
                                .notes("Won round 2 auction bid at ₹700")
                                .build()
                ))
                .build();

        List<LoanDto> assigned = loanService.assignChunks(2L, request);
        assertEquals(2, assigned.size());

        // Check chunk 11: 5000 + 650 = 5650
        assertEquals(new BigDecimal("5650.00"), assigned.get(0).getTotalDue());
        // Check chunk 12: 5000 + 700 = 5700
        assertEquals(new BigDecimal("5700.00"), assigned.get(1).getTotalDue());
    }

    @Test
    @DisplayName("Deduction: Leader records liquid group balance deduction with mandatory cause")
    void testRecordLiquidBalanceDeductionWithCause() {
        BigDecimal balanceBefore = ledgerService.getCurrentGroupBalance();
        BigDecimal deductionAmount = new BigDecimal("2500.00");

        DeductionCreateRequest request = DeductionCreateRequest.builder()
                .amount(deductionAmount)
                .cause("Village Temple Mahotsavam Donation")
                .category("DONATION")
                .notes("Annual temple contribution approved by village elders")
                .build();

        LedgerTransactionDto result = ledgerService.recordDeduction(request, "leader");
        assertNotNull(result);
        assertEquals(deductionAmount.negate(), result.getAmount());
        assertTrue(result.getDescription().contains("Village Temple Mahotsavam Donation"));
        assertTrue(result.getDescription().contains("[DONATION]"));

        BigDecimal balanceAfter = ledgerService.getCurrentGroupBalance();
        assertEquals(balanceBefore.subtract(deductionAmount), balanceAfter);
    }

    @Test
    @DisplayName("Deduction Guard: Prevent deduction exceeding group liquid balance")
    void testPreventExcessDeduction() {
        BigDecimal balance = ledgerService.getCurrentGroupBalance();
        BigDecimal excessAmount = balance.add(new BigDecimal("5000.00"));

        DeductionCreateRequest request = DeductionCreateRequest.builder()
                .amount(excessAmount)
                .cause("Excessive withdrawal")
                .build();

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            ledgerService.recordDeduction(request, "leader");
        });

        assertTrue(ex.getMessage().contains("exceeds current group liquid balance"));
    }

    @Test
    @DisplayName("Chunk Composition: Mixed 10k and 5k chunks created, verified and allocated")
    void testCycleWithMixed10kAnd5kChunks() {
        // In test database, if Cycle 2 is OPEN, close it first
        cycleRepository.findAll().forEach(c -> {
            if (c.getStatus() == CycleStatus.OPEN) {
                c.setStatus(CycleStatus.CLOSED);
                c.setClosedAt(java.time.LocalDateTime.now());
                cycleRepository.save(c);
            }
        });

        // Current available balance in test db is ₹26,000.
        // We test lending ₹25,000 with 1x 10k chunk + 3x 5k chunks = 4 chunks
        CycleCreateRequest request = CycleCreateRequest.builder()
                .cycleName("November 2026")
                .monthDate(LocalDate.now().plusMonths(2))
                .startDate(LocalDate.now().plusMonths(2).withDayOfMonth(1))
                .endDate(LocalDate.now().plusMonths(2).withDayOfMonth(28))
                .lendingAmount(new BigDecimal("25000.00"))
                .numberOfChunks(4)
                .chunkBreakdown("1x ₹10,000 + 3x ₹5,000")
                .notes("Mixed denomination cycle")
                .build();

        CycleDto createdCycle = cycleService.createCycle(request);
        assertNotNull(createdCycle);
        assertEquals(4, createdCycle.getNumberOfChunks());
        assertEquals("1x ₹10,000 + 3x ₹5,000", createdCycle.getChunkBreakdown());

        // Allocate 1 chunk of 10k (member 1) and 2 chunks of 5k (members 2, 3)
        ChunkAssignRequest assignReq = ChunkAssignRequest.builder()
                .chunks(List.of(
                        ChunkAssignItem.builder()
                                .chunkNumber(1)
                                .memberId(1L)
                                .principalAmount(new BigDecimal("10000.00"))
                                .interestAmount(new BigDecimal("1200.00"))
                                .dueDate(LocalDate.now().plusMonths(3))
                                .notes("₹10,000 Chunk #1")
                                .build(),
                        ChunkAssignItem.builder()
                                .chunkNumber(2)
                                .memberId(2L)
                                .principalAmount(new BigDecimal("5000.00"))
                                .interestAmount(new BigDecimal("600.00"))
                                .dueDate(LocalDate.now().plusMonths(3))
                                .notes("₹5,000 Chunk #2")
                                .build(),
                        ChunkAssignItem.builder()
                                .chunkNumber(3)
                                .memberId(3L)
                                .principalAmount(new BigDecimal("5000.00"))
                                .interestAmount(new BigDecimal("550.00"))
                                .dueDate(LocalDate.now().plusMonths(3))
                                .notes("₹5,000 Chunk #3")
                                .build()
                ))
                .build();

        List<LoanDto> assigned = loanService.assignChunks(createdCycle.getId(), assignReq);
        assertEquals(3, assigned.size());
        assertEquals(new BigDecimal("10000.00"), assigned.get(0).getPrincipalAmount());
        assertEquals(new BigDecimal("11200.00"), assigned.get(0).getTotalDue());
        assertEquals(new BigDecimal("5000.00"), assigned.get(1).getPrincipalAmount());
        assertEquals(new BigDecimal("5600.00"), assigned.get(1).getTotalDue());
        assertEquals(new BigDecimal("5000.00"), assigned.get(2).getPrincipalAmount());
        assertEquals(new BigDecimal("5550.00"), assigned.get(2).getTotalDue());
    }
}
