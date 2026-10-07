package com.yxw1268.fyp.web.rest;

import com.yxw1268.fyp.security.SecurityUtils;
import com.yxw1268.fyp.service.AssistantService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * The in-app assistant: change a meal, adjust this week's training, update food preferences.
 */
@RestController
@RequestMapping("/api/assistant")
public class AssistantResource {

    private final AssistantService assistantService;

    public AssistantResource(AssistantService assistantService) {
        this.assistantService = assistantService;
    }

    /**
     * @param today the user's current day of the week, 0 = Sunday
     * @param focusDay and focusSlot: the meal the user opened the assistant from, if any
     */
    public record MessageVM(String text, Integer today, Integer focusDay, String focusSlot) {}

    public record ConfirmVM(String proposalId) {}

    /**
     * {@code POST  /assistant/message} : send a message. The answer is a fixed reply, a link to a page,
     * or a proposal that changes nothing until confirmed.
     */
    @PostMapping("/message")
    public AssistantService.Reply message(@RequestBody MessageVM message) {
        return assistantService.handle(currentLogin(), message.text(), message.today(), message.focusDay(), message.focusSlot());
    }

    /**
     * {@code POST  /assistant/confirm} : carry out the proposal the assistant last made to this user.
     */
    @PostMapping("/confirm")
    public AssistantService.Reply confirm(@RequestBody ConfirmVM confirmation) {
        return assistantService.confirm(currentLogin(), confirmation.proposalId());
    }

    private static String currentLogin() {
        return SecurityUtils.getCurrentUserLogin().orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }
}
