package com.maridimamba.repository;

import com.maridimamba.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByLoanIdOrderByPaymentDateDesc(Long loanId);
    List<Payment> findByMemberIdOrderByPaymentDateDesc(Long memberId);
    List<Payment> findByCycleIdOrderByPaymentDateDesc(Long cycleId);
    List<Payment> findAllByOrderByPaymentDateDesc();

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.cycle.id = :cycleId")
    BigDecimal sumTotalPaymentsByCycleId(@Param("cycleId") Long cycleId);

    @Query("SELECT COALESCE(SUM(p.principalPortion), 0) FROM Payment p WHERE p.cycle.id = :cycleId")
    BigDecimal sumPrincipalPortionByCycleId(@Param("cycleId") Long cycleId);

    @Query("SELECT COALESCE(SUM(p.interestPortion), 0) FROM Payment p WHERE p.cycle.id = :cycleId")
    BigDecimal sumInterestPortionByCycleId(@Param("cycleId") Long cycleId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.member.id = :memberId")
    BigDecimal sumTotalPaymentsByMemberId(@Param("memberId") Long memberId);

    @Query("SELECT COALESCE(SUM(p.interestPortion), 0) FROM Payment p WHERE p.member.id = :memberId")
    BigDecimal sumInterestPaymentsByMemberId(@Param("memberId") Long memberId);
}
