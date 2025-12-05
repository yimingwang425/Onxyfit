package com.yxw1268.fyp.service.mapper;

import com.yxw1268.fyp.domain.Plan;
import com.yxw1268.fyp.domain.ProgressLog;
import com.yxw1268.fyp.domain.UserProfile;
import com.yxw1268.fyp.service.dto.PlanDTO;
import com.yxw1268.fyp.service.dto.ProgressLogDTO;
import com.yxw1268.fyp.service.dto.UserProfileDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link ProgressLog} and its DTO {@link ProgressLogDTO}.
 */
@Mapper(componentModel = "spring")
public interface ProgressLogMapper extends EntityMapper<ProgressLogDTO, ProgressLog> {
    @Mapping(target = "profile", source = "profile", qualifiedByName = "userProfileId")
    @Mapping(target = "plan", source = "plan", qualifiedByName = "planId")
    ProgressLogDTO toDto(ProgressLog s);

    @Named("userProfileId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    UserProfileDTO toDtoUserProfileId(UserProfile userProfile);

    @Named("planId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    PlanDTO toDtoPlanId(Plan plan);
}
