package com.yxw1268.fyp.repository;

import com.yxw1268.fyp.domain.UserProfile;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the UserProfile entity.
 */
@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    
    @Query("select p from UserProfile p left join fetch p.user u where u.login = :login")
    Optional<UserProfile> findOneByUserLogin(String login);
    
    @Query("select p from UserProfile p left join fetch p.user u where u.id = :userId")
    Optional<UserProfile> findOneByUserId(@Param("userId") Long userId);

    default Optional<UserProfile> findOneWithEagerRelationships(Long id) {
        return this.findOneWithToOneRelationships(id);
    }

    default List<UserProfile> findAllWithEagerRelationships() {
        return this.findAllWithToOneRelationships();
    }

    default Page<UserProfile> findAllWithEagerRelationships(Pageable pageable) {
        return this.findAllWithToOneRelationships(pageable);
    }

    @Query(
        value = "select userProfile from UserProfile userProfile left join fetch userProfile.user",
        countQuery = "select count(userProfile) from UserProfile userProfile"
    )
    Page<UserProfile> findAllWithToOneRelationships(Pageable pageable);

    @Query("select userProfile from UserProfile userProfile left join fetch userProfile.user")
    List<UserProfile> findAllWithToOneRelationships();

    @Query("select userProfile from UserProfile userProfile left join fetch userProfile.user where userProfile.id =:id")
    Optional<UserProfile> findOneWithToOneRelationships(@Param("id") Long id);
}