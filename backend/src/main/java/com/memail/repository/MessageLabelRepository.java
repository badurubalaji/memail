package com.memail.repository;

import com.memail.model.MessageLabel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageLabelRepository extends JpaRepository<MessageLabel, Long> {

    /**
     * Find all message labels for a specific user, message UID, and folder
     */
    List<MessageLabel> findByUserIdAndMessageUidAndFolder(String userId, String messageUid, String folder);

    /**
     * Find all message labels for a specific user and label ID
     */
    List<MessageLabel> findByUserIdAndLabelId(String userId, Long labelId);

    /**
     * Find all message labels for a specific label
     */
    List<MessageLabel> findByLabelId(Long labelId);

    /**
     * Check if a message has a specific label
     */
    boolean existsByUserIdAndMessageUidAndFolderAndLabelId(String userId, String messageUid, String folder, Long labelId);

    /**
     * Find a specific message label by user, message, folder, and label
     */
    Optional<MessageLabel> findByUserIdAndMessageUidAndFolderAndLabelId(String userId, String messageUid, String folder, Long labelId);

    /**
     * Delete all message labels for a specific user
     */
    void deleteByUserId(String userId);

    /**
     * Delete all message labels for a specific label
     */
    void deleteByLabelId(Long labelId);

    /**
     * Delete a specific message label
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM MessageLabel ml WHERE ml.userId = :userId AND ml.messageUid = :messageUid AND ml.folder = :folder AND ml.label.id = :labelId")
    int deleteByUserIdAndMessageUidAndFolderAndLabelId(@Param("userId") String userId,
                                                      @Param("messageUid") String messageUid,
                                                      @Param("folder") String folder,
                                                      @Param("labelId") Long labelId);

    /**
     * Find all messages with a specific label for a user
     */
    List<MessageLabel> findByUserIdAndLabelIdOrderByCreatedAtDesc(String userId, Long labelId);

    /**
     * Find message labels for multiple message UIDs
     */
    @Query("SELECT ml FROM MessageLabel ml WHERE ml.userId = :userId AND ml.messageUid IN :messageUids AND ml.folder = :folder")
    List<MessageLabel> findByUserIdAndMessageUidsAndFolder(@Param("userId") String userId,
                                                          @Param("messageUids") List<String> messageUids,
                                                          @Param("folder") String folder);

    /**
     * Get distinct message UIDs for a label
     */
    @Query("SELECT DISTINCT ml.messageUid FROM MessageLabel ml WHERE ml.userId = :userId AND ml.label.id = :labelId AND ml.folder = :folder")
    List<String> findMessageUidsByUserIdAndLabelIdAndFolder(@Param("userId") String userId,
                                                           @Param("labelId") Long labelId,
                                                           @Param("folder") String folder);

    /**
     * Delete message labels for multiple message UIDs
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM MessageLabel ml WHERE ml.userId = :userId AND ml.messageUid IN :messageUids AND ml.folder = :folder")
    int deleteByUserIdAndMessageUidsAndFolder(@Param("userId") String userId,
                                            @Param("messageUids") List<String> messageUids,
                                            @Param("folder") String folder);

    /**
     * Count messages with a specific label
     */
    @Query("SELECT COUNT(ml) FROM MessageLabel ml WHERE ml.label.id = :labelId")
    long countByLabelId(@Param("labelId") Long labelId);

    /**
     * Count messages with a specific label for a user
     */
    @Query("SELECT COUNT(ml) FROM MessageLabel ml WHERE ml.userId = :userId AND ml.label.id = :labelId")
    long countByUserIdAndLabelId(@Param("userId") String userId, @Param("labelId") Long labelId);
}