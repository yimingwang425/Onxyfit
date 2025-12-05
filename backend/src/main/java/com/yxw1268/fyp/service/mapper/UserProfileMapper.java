package com.yxw1268.fyp.service.mapper;

import com.yxw1268.fyp.domain.User;
import com.yxw1268.fyp.domain.UserProfile;
import com.yxw1268.fyp.service.dto.UserDTO;
import com.yxw1268.fyp.service.dto.UserProfileDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link UserProfile} and its DTO {@link UserProfileDTO}.
 */
@Mapper(componentModel = "spring")
public interface UserProfileMapper extends EntityMapper<UserProfileDTO, UserProfile> {
    @Mapping(target = "user", source = "user", qualifiedByName = "userLogin")
    UserProfileDTO toDto(UserProfile s);

    @Named("userLogin")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "login", source = "login")
    UserDTO toDtoUserLogin(User user);
}
