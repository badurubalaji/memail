package com.memail.controller;

import com.memail.model.Label;
import com.memail.model.MessageLabel;
import com.memail.service.LabelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/labels")
@CrossOrigin
public class LabelController {

    @Autowired
    private LabelService labelService;

    /**
     * Get all labels for the authenticated user
     * GET /api/labels
     */
    @GetMapping
    public ResponseEntity<?> getAllLabels(Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            List<Label> labels = labelService.getUserLabels(userId);

            return ResponseEntity.ok(Map.of(
                "labels", labels,
                "total", labels.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Failed to fetch labels",
                    "message", e.getMessage()
                ));
        }
    }

    /**
     * Get a specific label by ID
     * GET /api/labels/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getLabel(@PathVariable Long id, Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            return labelService.getLabel(userId, id)
                .map(label -> ResponseEntity.ok(Map.of("label", label)))
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Failed to fetch label",
                    "message", e.getMessage()
                ));
        }
    }

    /**
     * Create a new label
     * POST /api/labels
     */
    @PostMapping
    public ResponseEntity<?> createLabel(
            @RequestParam("name") String name,
            @RequestParam("color") String color,
            Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            Label label = labelService.createLabel(userId, name, color);

            return ResponseEntity.ok(Map.of(
                "message", "Label created successfully",
                "label", label
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of(
                    "error", "Invalid request",
                    "message", e.getMessage()
                ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Failed to create label",
                    "message", e.getMessage()
                ));
        }
    }

    /**
     * Update an existing label
     * PUT /api/labels/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateLabel(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("color") String color,
            Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            Label label = labelService.updateLabel(userId, id, name, color);

            return ResponseEntity.ok(Map.of(
                "message", "Label updated successfully",
                "label", label
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of(
                    "error", "Invalid request",
                    "message", e.getMessage()
                ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Failed to update label",
                    "message", e.getMessage()
                ));
        }
    }

    /**
     * Delete a label
     * DELETE /api/labels/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLabel(@PathVariable Long id, Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            labelService.deleteLabel(userId, id);

            return ResponseEntity.ok(Map.of(
                "message", "Label deleted successfully"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of(
                    "error", "Invalid request",
                    "message", e.getMessage()
                ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Failed to delete label",
                    "message", e.getMessage()
                ));
        }
    }

    /**
     * Get all messages with a specific label
     * GET /api/labels/{id}/messages
     */
    @GetMapping("/{id}/messages")
    public ResponseEntity<?> getMessagesWithLabel(@PathVariable Long id, Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            List<MessageLabel> messageLabels = labelService.getMessagesWithLabel(userId, id);

            return ResponseEntity.ok(Map.of(
                "messageLabels", messageLabels,
                "total", messageLabels.size()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of(
                    "error", "Invalid request",
                    "message", e.getMessage()
                ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Failed to fetch messages with label",
                    "message", e.getMessage()
                ));
        }
    }

    /**
     * Apply a label to a message
     * POST /api/labels/{id}/messages
     */
    @PostMapping("/{id}/messages")
    public ResponseEntity<?> applyLabelToMessage(
            @PathVariable Long id,
            @RequestParam("messageUid") String messageUid,
            @RequestParam("folder") String folder,
            Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            MessageLabel messageLabel = labelService.applyLabelToMessage(userId, messageUid, folder, id);

            return ResponseEntity.ok(Map.of(
                "message", "Label applied to message successfully",
                "messageLabel", messageLabel
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of(
                    "error", "Invalid request",
                    "message", e.getMessage()
                ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Failed to apply label to message",
                    "message", e.getMessage()
                ));
        }
    }

    /**
     * Remove a label from a message
     * DELETE /api/labels/{id}/messages
     */
    @DeleteMapping("/{id}/messages")
    public ResponseEntity<?> removeLabelFromMessage(
            @PathVariable Long id,
            @RequestParam("messageUid") String messageUid,
            @RequestParam("folder") String folder,
            Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            labelService.removeLabelFromMessage(userId, messageUid, folder, id);

            return ResponseEntity.ok(Map.of(
                "message", "Label removed from message successfully"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of(
                    "error", "Invalid request",
                    "message", e.getMessage()
                ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Failed to remove label from message",
                    "message", e.getMessage()
                ));
        }
    }

    /**
     * Get all labels applied to a specific message
     * GET /api/labels/messages/{messageUid}
     */
    @GetMapping("/messages/{messageUid}")
    public ResponseEntity<?> getMessageLabels(
            @PathVariable String messageUid,
            @RequestParam("folder") String folder,
            Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            List<MessageLabel> messageLabels = labelService.getMessageLabels(userId, messageUid, folder);

            return ResponseEntity.ok(Map.of(
                "messageLabels", messageLabels,
                "total", messageLabels.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Failed to fetch message labels",
                    "message", e.getMessage()
                ));
        }
    }

    /**
     * Apply labels to multiple messages in batch
     * POST /api/labels/batch/apply
     */
    @PostMapping("/batch/apply")
    public ResponseEntity<?> applyLabelsToMessages(
            @RequestParam("messageUids") List<String> messageUids,
            @RequestParam("folder") String folder,
            @RequestParam("labelIds") List<Long> labelIds,
            Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            labelService.applyLabelsToMessages(userId, messageUids, folder, labelIds);

            return ResponseEntity.ok(Map.of(
                "message", "Labels applied to messages successfully",
                "processedMessages", messageUids.size(),
                "appliedLabels", labelIds.size()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of(
                    "error", "Invalid request",
                    "message", e.getMessage()
                ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Failed to apply labels to messages",
                    "message", e.getMessage()
                ));
        }
    }

    /**
     * Remove labels from multiple messages in batch
     * POST /api/labels/batch/remove
     */
    @PostMapping("/batch/remove")
    public ResponseEntity<?> removeLabelsFromMessages(
            @RequestParam("messageUids") List<String> messageUids,
            @RequestParam("folder") String folder,
            @RequestParam("labelIds") List<Long> labelIds,
            Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            labelService.removeLabelsFromMessages(userId, messageUids, folder, labelIds);

            return ResponseEntity.ok(Map.of(
                "message", "Labels removed from messages successfully",
                "processedMessages", messageUids.size(),
                "removedLabels", labelIds.size()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of(
                    "error", "Invalid request",
                    "message", e.getMessage()
                ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Failed to remove labels from messages",
                    "message", e.getMessage()
                ));
        }
    }

    /**
     * Get message UIDs for a specific label and folder
     * GET /api/labels/{id}/messages/uids
     */
    @GetMapping("/{id}/messages/uids")
    public ResponseEntity<?> getMessageUidsWithLabel(
            @PathVariable Long id,
            @RequestParam("folder") String folder,
            Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            List<String> messageUids = labelService.getMessageUidsWithLabel(userId, id, folder);

            return ResponseEntity.ok(Map.of(
                "messageUids", messageUids,
                "total", messageUids.size()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of(
                    "error", "Invalid request",
                    "message", e.getMessage()
                ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Failed to fetch message UIDs with label",
                    "message", e.getMessage()
                ));
        }
    }

    /**
     * Get usage count for a specific label
     * GET /api/labels/{id}/count
     */
    @GetMapping("/{id}/count")
    public ResponseEntity<?> getLabelUsageCount(@PathVariable Long id, Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            long count = labelService.getLabelUsageCount(userId, id);

            return ResponseEntity.ok(Map.of(
                "labelId", id,
                "usageCount", count
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of(
                    "error", "Invalid request",
                    "message", e.getMessage()
                ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Failed to fetch label usage count",
                    "message", e.getMessage()
                ));
        }
    }
}