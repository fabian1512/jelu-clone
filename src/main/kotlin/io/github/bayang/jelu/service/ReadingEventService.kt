package io.github.bayang.jelu.service

import io.github.bayang.jelu.dao.ReadingEventRepository
import io.github.bayang.jelu.dao.ReadingEventType
import io.github.bayang.jelu.dto.CreateReadingEventDto
import io.github.bayang.jelu.dto.ReadingEventDto
import io.github.bayang.jelu.dto.UpdateReadingEventDto
import io.github.bayang.jelu.dto.UserDto
import io.github.bayang.jelu.errors.JeluAuthenticationException
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID
import io.github.bayang.jelu.dao.ReadingEvent as ReadingEventDao

@Component
class ReadingEventService(
    private val readingEventRepository: ReadingEventRepository,
) {
    @Transactional
    fun findAll(
        eventTypes: List<ReadingEventType>?,
        userId: UUID?,
        bookId: UUID?,
        startedAfter: LocalDate?,
        startedBefore: LocalDate?,
        endedAfter: LocalDate?,
        endedBefore: LocalDate?,
        pageable: Pageable,
    ) = readingEventRepository.findAll(eventTypes, userId, bookId, startedAfter, startedBefore, endedAfter, endedBefore, pageable).map {
        it.toReadingEventDto()
    }

    @Transactional
    fun findAllForStats(
        eventTypes: List<ReadingEventType>?,
        userId: UUID?,
        bookId: UUID?,
        startedAfter: LocalDate?,
        startedBefore: LocalDate?,
        endedAfter: LocalDate?,
        endedBefore: LocalDate?,
        pageable: Pageable,
    ) = readingEventRepository.findAll(eventTypes, userId, bookId, startedAfter, startedBefore, endedAfter, endedBefore, pageable).map {
        it.toReadingEventStatsDto()
    }

    @Transactional
    fun findAllByUserAndBookIds(
        userId: UUID,
        bookIds: List<UUID>,
    ) = readingEventRepository.findAllByUserAndBookIds(userId, bookIds)

    @Transactional
    fun findYears(
        eventTypes: List<ReadingEventType>?,
        userId: UUID?,
        bookId: UUID?,
    ) = readingEventRepository.findYears(eventTypes, userId, bookId)

    @Transactional
    fun save(
        createReadingEventDto: CreateReadingEventDto,
        user: UserDto,
    ): ReadingEventDto = readingEventRepository.save(createReadingEventDto, user).toReadingEventDto()

    @Transactional
    fun updateReadingEvent(
        readingEventId: UUID,
        updateReadingEventDto: UpdateReadingEventDto,
        userId: UUID? = null,
    ): ReadingEventDto {
        if (userId != null) {
            val entity = ReadingEventDao[readingEventId]
            if (entity.userBook.user.id.value != userId) throw JeluAuthenticationException("Resource unauthorized")
        }
        return readingEventRepository.updateReadingEvent(readingEventId, updateReadingEventDto).toReadingEventDto()
    }

    @Transactional
    fun deleteReadingEventById(
        eventId: UUID,
        userId: UUID? = null,
    ) {
        if (userId != null) {
            val entity = ReadingEventDao[eventId]
            if (entity.userBook.user.id.value != userId) throw JeluAuthenticationException("Resource unauthorized")
        }
        readingEventRepository.deleteReadingEventById(eventId)
    }
}
