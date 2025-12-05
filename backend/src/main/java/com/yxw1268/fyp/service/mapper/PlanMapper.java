package com.yxw1268.fyp.service.mapper;

import com.yxw1268.fyp.domain.Plan;
import com.yxw1268.fyp.domain.UserProfile;
import com.yxw1268.fyp.service.dto.PlanDTO;
import com.yxw1268.fyp.service.dto.UserProfileDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Plan} and its DTO {@link PlanDTO}.
 */
@Mapper(componentModel = "spring")
public interface PlanMapper extends EntityMapper<PlanDTO, Plan> {
    @Mapping(target = "profile", source = "profile", qualifiedByName = "userProfileId")
    PlanDTO toDto(Plan s);

    @Named("userProfileId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    UserProfileDTO toDtoUserProfileId(UserProfile userProfile);
}
