package com.maridimamba.repository;

import com.maridimamba.entity.Loan;
import com.maridimamba.enums.LoanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByCycleIdOrderByChunkNumberAsc(Long cycleId);
    List<Loan> findByMemberIdOrderByDueDateDesc(Long memberId);
    List<Loan> findAllByOrderByCreatedAtDesc();
    List<Loan> findByStatus(LoanStatus status);
    long countByStatus(LoanStatus status);
    long countByCycleId(Long cycleId);
    long countByCycleIdAndStatus(Long cycleId, LoanStatus status);

    boolean existsByCycleIdAndMemberId(Long cycleId, Long memberId);

    @Query("SELECT l.member.id FROM Loan l WHERE l.cycle.id = :cycleId")
    List<Long> findMemberIdsByCycleId(@Param("cycleId") Long cycleId);

    @Query("SELECT COUNT(l) FROM Loan l WHERE l.cycle.id = :cycleId AND l.status <> com.maridimamba.enums.LoanStatus.PAID")
    long countUnpaidLoansInCycle(@Param("cycleId") Long cycleId);

    @Query("SELECT COALESCE(SUM(l.principalAmount), 0) FROM Loan l WHERE l.cycle.id = :cycleId")
    BigDecimal sumPrincipalByCycleId(@Param("cycleId") Long cycleId);

    @Query("SELECT COALESCE(SUM(l.interestAmount), 0) FROM Loan l WHERE l.cycle.id = :cycleId")
    BigDecimal sumInterestByCycleId(@Param("cycleId") Long cycleId);

    @Query("SELECT COALESCE(SUM(l.totalDue), 0) FROM Loan l WHERE l.cycle.id = :cycleId")
    BigDecimal sumTotalDueByCycleId(@Param("cycleId") Long cycleId);

    @Query("SELECT COALESCE(SUM(l.amountPaid), 0) FROM Loan l WHERE l.cycle.id = :cycleId")
    BigDecimal sumAmountPaidByCycleId(@Param("cycleId") Long cycleId);

    @Query("SELECT COALESCE(SUM(l.remainingAmount), 0) FROM Loan l WHERE l.cycle.id = :cycleId")
    BigDecimal sumRemainingAmountByCycleId(@Param("cycleId") Long cycleId);

    @Query("SELECT COALESCE(SUM(l.remainingAmount), 0) FROM Loan l WHERE l.cycle.id = :cycleId AND l.status = com.maridimamba.enums.LoanStatus.OVERDUE")
    BigDecimal sumOverdueAmountByCycleId(@Param("cycleId") Long cycleId);

    // Member aggregate queries
    @Query("SELECT COALESCE(SUM(l.principalAmount), 0) FROM Loan l WHERE l.member.id = :memberId")
    BigDecimal sumPrincipalByMemberId(@Param("memberId") Long memberId);

    @Query("SELECT COALESCE(SUM(l.amountPaid), 0) FROM Loan l WHERE l.member.id = :memberId")
    BigDecimal sumAmountPaidByMemberId(@Param("memberId") Long memberId);

    @Query("SELECT COALESCE(SUM(l.remainingAmount), 0) FROM Loan l WHERE l.member.id = :memberId")
    BigDecimal sumRemainingByMemberId(@Param("memberId") Long memberId);

    @Query("SELECT COALESCE(SUM(l.interestAmount), 0) FROM Loan l WHERE l.member.id = :memberId AND l.status = com.maridimamba.enums.LoanStatus.PAID")
    BigDecimal sumPaidInterestByMemberId(@Param("memberId") Long memberId);
}
