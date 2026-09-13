package com.maridimamba.repository;

import com.maridimamba.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findAllByOrderByActiveDescNameAsc();
    List<Member> findByActiveTrueOrderByNameAsc();
    long countByActiveTrue();
    long countByActiveFalse();
}
