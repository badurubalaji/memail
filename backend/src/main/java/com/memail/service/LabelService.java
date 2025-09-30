package com.memail.service;

import com.memail.model.Label;
import com.memail.model.MessageLabel;
import com.memail.repository.LabelRepository;
import com.memail.repository.MessageLabelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class LabelService {

    @Autowired
    private LabelRepository labelRepository;

    @Autowired
    private MessageLabelRepository messageLabelRepository;

    /**
     * Get all labels for a user
     */
    public List<Label> getUserLabels(String userId) {
        return labelRepository.findByUserIdOrderByNameAsc(userId);
    }

    /**
     * Create a new label for a user
     */
    public Label createLabel(String userId, String name, String color) {
        if (labelRepository.existsByUserIdAndName(userId, name)) {
            throw new IllegalArgumentException("Label with name '" + name + "' already exists");
        }

        Label label = new Label(userId, name, color);
        return labelRepository.save(label);
    }

    /**
     * Update an existing label
     */
    public Label updateLabel(String userId, Long labelId, String name, String color) {
        Optional<Label> labelOpt = labelRepository.findByUserIdAndId(userId, labelId);
        if (labelOpt.isEmpty()) {
            throw new IllegalArgumentException("Label not found or does not belong to user");
        }

        Label label = labelOpt.get();

        // Check if new name conflicts with existing labels (excluding current label)
        if (!label.getName().equals(name) && labelRepository.existsByUserIdAndName(userId, name)) {
            throw new IllegalArgumentException("Label with name '" + name + "' already exists");
        }

        label.setName(name);
        label.setColor(color);
        return labelRepository.save(label);
    }

    /**
     * Delete a label and all its message associations
     */
    public void deleteLabel(String userId, Long labelId) {
        Optional<Label> labelOpt = labelRepository.findByUserIdAndId(userId, labelId);
        if (labelOpt.isEmpty()) {
            throw new IllegalArgumentException("Label not found or does not belong to user");
        }

        // Delete all message label associations first
        messageLabelRepository.deleteByLabelId(labelId);

        // Then delete the label itself
        labelRepository.deleteById(labelId);
    }

    /**
     * Get a specific label by ID for a user
     */
    public Optional<Label> getLabel(String userId, Long labelId) {
        return labelRepository.findByUserIdAndId(userId, labelId);
    }

    /**
     * Apply a label to a message
     */
    public MessageLabel applyLabelToMessage(String userId, String messageUid, String folder, Long labelId) {
        // Verify the label belongs to the user
        Optional<Label> labelOpt = labelRepository.findByUserIdAndId(userId, labelId);
        if (labelOpt.isEmpty()) {
            throw new IllegalArgumentException("Label not found or does not belong to user");
        }

        // Check if the label is already applied to this message
        if (messageLabelRepository.existsByUserIdAndMessageUidAndFolderAndLabelId(userId, messageUid, folder, labelId)) {
            throw new IllegalArgumentException("Label is already applied to this message");
        }

        Label label = labelOpt.get();
        MessageLabel messageLabel = new MessageLabel(userId, messageUid, folder, label);
        return messageLabelRepository.save(messageLabel);
    }

    /**
     * Remove a label from a message
     */
    public void removeLabelFromMessage(String userId, String messageUid, String folder, Long labelId) {
        // Verify the label belongs to the user
        if (!labelRepository.findByUserIdAndId(userId, labelId).isPresent()) {
            throw new IllegalArgumentException("Label not found or does not belong to user");
        }

        messageLabelRepository.deleteByUserIdAndMessageUidAndFolderAndLabelId(userId, messageUid, folder, labelId);
    }

    /**
     * Get all labels applied to a specific message
     */
    public List<MessageLabel> getMessageLabels(String userId, String messageUid, String folder) {
        return messageLabelRepository.findByUserIdAndMessageUidAndFolder(userId, messageUid, folder);
    }

    /**
     * Get all messages with a specific label
     */
    public List<MessageLabel> getMessagesWithLabel(String userId, Long labelId) {
        // Verify the label belongs to the user
        if (!labelRepository.findByUserIdAndId(userId, labelId).isPresent()) {
            throw new IllegalArgumentException("Label not found or does not belong to user");
        }

        return messageLabelRepository.findByUserIdAndLabelIdOrderByCreatedAtDesc(userId, labelId);
    }

    /**
     * Check if a message has a specific label
     */
    public boolean messageHasLabel(String userId, String messageUid, String folder, Long labelId) {
        return messageLabelRepository.existsByUserIdAndMessageUidAndFolderAndLabelId(userId, messageUid, folder, labelId);
    }

    /**
     * Apply labels to multiple messages in batch
     */
    public void applyLabelsToMessages(String userId, List<String> messageUids, String folder, List<Long> labelIds) {
        // Verify all labels belong to the user
        for (Long labelId : labelIds) {
            if (!labelRepository.findByUserIdAndId(userId, labelId).isPresent()) {
                throw new IllegalArgumentException("Label with ID " + labelId + " not found or does not belong to user");
            }
        }

        for (String messageUid : messageUids) {
            for (Long labelId : labelIds) {
                // Only apply if not already applied
                if (!messageLabelRepository.existsByUserIdAndMessageUidAndFolderAndLabelId(userId, messageUid, folder, labelId)) {
                    Label label = labelRepository.findByUserIdAndId(userId, labelId).get();
                    MessageLabel messageLabel = new MessageLabel(userId, messageUid, folder, label);
                    messageLabelRepository.save(messageLabel);
                }
            }
        }
    }

    /**
     * Remove labels from multiple messages in batch
     */
    public void removeLabelsFromMessages(String userId, List<String> messageUids, String folder, List<Long> labelIds) {
        // Verify all labels belong to the user
        for (Long labelId : labelIds) {
            if (!labelRepository.findByUserIdAndId(userId, labelId).isPresent()) {
                throw new IllegalArgumentException("Label with ID " + labelId + " not found or does not belong to user");
            }
        }

        for (Long labelId : labelIds) {
            for (String messageUid : messageUids) {
                messageLabelRepository.deleteByUserIdAndMessageUidAndFolderAndLabelId(userId, messageUid, folder, labelId);
            }
        }
    }

    /**
     * Get message UIDs for a specific label and folder
     */
    public List<String> getMessageUidsWithLabel(String userId, Long labelId, String folder) {
        // Verify the label belongs to the user
        if (!labelRepository.findByUserIdAndId(userId, labelId).isPresent()) {
            throw new IllegalArgumentException("Label not found or does not belong to user");
        }

        return messageLabelRepository.findMessageUidsByUserIdAndLabelIdAndFolder(userId, labelId, folder);
    }

    /**
     * Get label count for a specific label
     */
    public long getLabelUsageCount(String userId, Long labelId) {
        // Verify the label belongs to the user
        if (!labelRepository.findByUserIdAndId(userId, labelId).isPresent()) {
            throw new IllegalArgumentException("Label not found or does not belong to user");
        }

        return messageLabelRepository.countByUserIdAndLabelId(userId, labelId);
    }

    /**
     * Delete all data for a user (for user deletion)
     */
    public void deleteAllUserData(String userId) {
        messageLabelRepository.deleteByUserId(userId);
        labelRepository.deleteByUserId(userId);
    }
}