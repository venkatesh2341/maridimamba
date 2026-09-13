package com.maridimamba.repository;

import com.maridimamba.entity.LedgerTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface LedgerTransactionRepository extends JpaRepository<LedgerTransaction, Long> {
    Optional<LedgerTransaction> findTopByOrderByTransactionDateDescIdDesc();
    List<LedgerTransaction> findAllByOrderByTransactionDateDescIdDesc();
    List<LedgerTransaction> findByCycleIdOrderByTransactionDateAscIdAsc(Long cycleId);

    @Query("SELECT COALESCE(SUM(lt.amount), 0) FROM LedgerTransaction lt")
    BigDecimal sumTotalBalance();
}
