package com.maridimamba.repository;

import com.maridimamba.entity.MonthlyCycle;
import com.maridimamba.enums.CycleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MonthlyCycleRepository extends JpaRepository<MonthlyCycle, Long> {
    List<MonthlyCycle> findAllByOrderByMonthDateDesc();
    Optional<MonthlyCycle> findTopByStatusOrderByMonthDateDesc(CycleStatus status);
    Optional<MonthlyCycle> findTopByOrderByMonthDateDesc();
    Optional<MonthlyCycle> findTopByStatusOrderByClosedAtDesc(CycleStatus status);
    boolean existsByStatus(CycleStatus status);
}
