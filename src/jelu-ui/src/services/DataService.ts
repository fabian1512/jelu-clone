import axios, { AxiosError, AxiosInstance } from "axios";
import { Book } from "../model/Book";
import { CreateReadingEvent, ReadingEvent, ReadingEventType, ReadingEventWithUserBook } from "../model/ReadingEvent";
import { Tag } from "../model/Tag";
import { Metadata } from "../model/Metadata";
import { Page } from "../model/Page";

import { ImportConfigurationDto } from "../model/ImportConfiguration";
import qs from "qs";
import dayjs from "dayjs";
import { LibraryFilter } from "../model/LibraryFilter";
import { WikipediaSearchResult } from "../model/WikipediaSearchResult";
import { WikipediaPageResult } from "../model/WikipediaPageResult";





import { MetadataRequest } from "../model/MetadataRequest";

import { DirectoryListing } from "../model/DirectoryListing";


import { createApiClient } from "./apiClientFactory";

class DataService {

  private apiClient: AxiosInstance;

  private token?: string = '';

  private TOKEN_KEY = 'jelu-token'

  private API_TAG = '/tags';

  

  private API_METADATA = '/metadata';

  private API_READING_EVENTS = '/reading-events';

  private API_IMPORTS = '/imports';

  private API_EXPORTS = '/exports';

  constructor() {
    this.apiClient = createApiClient(() => this.getToken());
  }

  getToken = (): string | null => {
    if (this.token != null && this.token.trim().length > 0) {
      localStorage.setItem(this.TOKEN_KEY, this.token)
      return this.token
    }
    else if (localStorage.getItem(this.TOKEN_KEY) != null) {
      return localStorage.getItem(this.TOKEN_KEY)
    }
    else {
      return null
    }
  }

  findTagsByCriteria = async (query?: string | null) => {
    try {
      const response = await this.apiClient.get<Page<Tag>>(`${this.API_TAG}`, {
        params: {
          name: query
        }
      });
      return response.data;
    }
    catch (error) {
      if (axios.isAxiosError(error) && error.response) {
      }
      throw new Error("error get tags by criteria " + error)
    }
  }

  getTagById = async (tagId: string) => {
    try {
      const response = await this.apiClient.get<Tag>(`${this.API_TAG}/${tagId}`);
      return response.data;
    }
    catch (error) {
      if (axios.isAxiosError(error) && error.response) {
      }
      throw new Error("error get tag by id " + error)
    }
  }

  getTagBooksById = async (tagId: string,
    page?: number, size?: number, sort?: string, libraryFilter?: LibraryFilter, lastEventTypes?: Array<ReadingEventType> | null) => {
    try {
      const response = await this.apiClient.get<Page<Book>>(`${this.API_TAG}/${tagId}/books`, {
        params: {
          page: page,
          size: size,
          sort: sort,
          libraryFilter: libraryFilter,
          lastEventTypes: lastEventTypes,
        },
        paramsSerializer: {
          serialize : (params) => {
            return qs.stringify(params, { arrayFormat: 'comma' })
        }},
      });
      return response.data;
    }
    catch (error) {
      if (axios.isAxiosError(error) && error.response) {
      }
      throw new Error("error get tag books by id " + error)
    }
  }

  getOrphanTags = async (page?: number, size?: number, sort?: string) => {
    try {
      const response = await this.apiClient.get<Page<Tag>>(`${this.API_TAG}/orphans`, {
        params: {
          page: page,
          size: size,
          sort: sort,
        }
      });
      return response.data;
    }
    catch (error) {
      if (axios.isAxiosError(error) && error.response) {
      }
      throw new Error("error get tag orphans " + error)
    }
  }

  fetchMetadata = async (isbn?: string, title?: string, authors?: string) => {
    try {
      const response = await this.apiClient.get<Metadata>(`${this.API_METADATA}`, {
        params: {
          isbn: isbn,
          title: title,
          authors: authors
        }
      });
      return response.data;
    }
    catch (error) {
      if (axios.isAxiosError(error) && error.response) {
      }
      throw new Error("error metadata " + error)
    }
  }

  fetchMetadataWithPlugins = async (metadataRequest: MetadataRequest) => {
    try {

      const response = await this.apiClient.post<Metadata>(`${this.API_METADATA}`, metadataRequest)
      return response.data;
    }
    catch (error) {
      if (axios.isAxiosError(error) && error.response) {
      }
      throw new Error("error metadata " + error)
    }
  }

  searchMetadataWithPlugins = async (metadataRequest: MetadataRequest) => {
    try {
      const response = await this.apiClient.post<Metadata[]>(`${this.API_METADATA}/search`, metadataRequest)
      return response.data;
    }
    catch (error) {
      if (axios.isAxiosError(error) && error.response) {
      }
      throw new Error("error search metadata " + error)
    }
  }

  deleteReadingEvent = async (eventId: string) => {
    try {
      const response = await this.apiClient.delete(`${this.API_READING_EVENTS}/${eventId}`);
      return response.data;
    }
    catch (error) {
      if (axios.isAxiosError(error) && error.response) {
      }
      throw new Error("error delete event " + error)
    }
  }

  deleteTag = async (tagId: string) => {
    try {
      const response = await this.apiClient.delete(`${this.API_TAG}/${tagId}`);
      return response.data;
    }
    catch (error) {
      if (axios.isAxiosError(error) && error.response) {
      }
      throw new Error("error delete tag " + error)
    }
  }

  /*
  * Dates are deserialized as strings, convert to Date instead
  */
  transformReadingEvents = (data: string) => {
    const page = JSON.parse(data)
    if (page.content) {
      for (const ev of page.content) {
        if (ev.modificationDate != null) {
          ev.modificationDate = dayjs(ev.modificationDate).toDate()
        }
        if (ev.startDate != null) {
          ev.startDate = dayjs(ev.startDate).toDate()
        }
        if (ev.endDate != null) {
          ev.endDate = dayjs(ev.endDate).toDate()
        }
      }
    }
    return page
  }

  myReadingEvents = async (eventTypes?: Array<ReadingEventType> | null, bookId?: string,
    startedAfter?: string, startedBefore?: string,
    endedAfter?: string, endedBefore?: string,
    page?: number, size?: number, sort?: string) => {
    try {
      const response = await this.apiClient.get<Page<ReadingEventWithUserBook>>(`${this.API_READING_EVENTS}/me`, {
        params: {
          eventTypes: eventTypes,
          bookId: bookId,
          startedAfter: startedAfter,
          startedBefore: startedBefore,
          endedAfter: endedAfter,
          endedBefore: endedBefore,
          page: page,
          size: size,
          sort: sort
        },
        paramsSerializer: {
          serialize : (params) => {
            return qs.stringify(params, { arrayFormat: 'comma' })
        }},
        transformResponse: this.transformReadingEvents
      });
      return response.data;
    }
    catch (error) {
      if (axios.isAxiosError(error) && error.response) {
      }
      throw new Error("error my events " + error)
    }
  }

  findReadingEvents = async (eventTypes?: Array<ReadingEventType> | null, userId?: string, bookId?: string,
    startedAfter?: string, startedBefore?: string,
    endedAfter?: string, endedBefore?: string,
    page?: number, size?: number, sort?: string) => {
    try {
      const response = await this.apiClient.get<Page<ReadingEventWithUserBook>>(`${this.API_READING_EVENTS}`, {
        params: {
          eventTypes: eventTypes,
          userId: userId,
          bookId: bookId,
          startedAfter: startedAfter,
          startedBefore: startedBefore,
          endedAfter: endedAfter,
          endedBefore: endedBefore,
          page: page,
          size: size,
          sort: sort
        },
        paramsSerializer: {
          serialize : (params) => {
            return qs.stringify(params, { arrayFormat: 'comma' })
        }},
        transformResponse: this.transformReadingEvents
      });
      return response.data;
    }
    catch (error) {
      if (axios.isAxiosError(error) && error.response) {
      }
      throw new Error("error events " + error)
    }
  }

  importCsv = async (importConfig: ImportConfigurationDto, file: File, onUploadProgress: any) => {
    try {
      const formData = new FormData()
      formData.append('file', file);
      formData.append('importConfig', new Blob([JSON.stringify(importConfig)], {
        type: "application/json"
      }));
      await this.apiClient.post(this.API_IMPORTS, formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          },
          onUploadProgress: onUploadProgress
        })
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error("error import csv " + error.response.status + " " + error)
      }
      throw new Error("error importing csv " + error)
    }
  }

  exportCsv = async () => {
    try {
      await this.apiClient.post(this.API_EXPORTS)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error("error export csv " + error.response.status + " " + error)
      }
      throw new Error("error exporting csv request" + error)
    }
  }

  updateReadingEvent = async (event: ReadingEvent) => {
    try {
      const resp = await this.apiClient.put<ReadingEvent>(`${this.API_READING_EVENTS}/${event.id}`, {
        eventType: event.eventType,
        eventDate: event.endDate,
        startDate: event.startDate
      })
      return resp.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error("error updating event " + error.response.status + " " + error)
      }
      throw new Error("error updating event " + error)
    }
  }

  createReadingEvent = async (event: CreateReadingEvent) => {
    try {
      const resp = await this.apiClient.post<ReadingEvent>(`${this.API_READING_EVENTS}`, event)
      return resp.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error("error creating event " + error.response.status + " " + error)
      }
      throw new Error("error creating event " + error)
    }
  }

  wikipediaSearch = async (query: string, language: string) => {
    const wikiClient = createApiClient();
    const response = await wikiClient.get<WikipediaSearchResult>("/wikipedia/search", {
      params: { query, language }
    });
    return response.data;
  };

  wikipediaPage = async (pageTitle: string, language: string) => {
    const wikiClient = createApiClient();
    const response = await wikiClient.get<WikipediaPageResult>("/wikipedia/page", {
      params: { pageTitle, language }
    });
    return response.data;
  };

  /*
  * Dates are deserialized as strings, convert to Date instead
  */
  getDirectoryListing = async (path: string, reason = "metadata") => {
    try {
      const response = await this.apiClient.post<DirectoryListing>('/filesystem', {'reason' : reason, 'path' : path});
      return response.data;
    }
    catch (error) {
      if (axios.isAxiosError(error) && error.response) {
      }
      throw new Error("error directory " + path + " " + error)
    }
  }

  getMetadataFromUploadedFile = async (file: File | null, onUploadProgress: any) => {
    try {
      const formData = new FormData()
      if (file != null) {
        formData.append('file', file);
      }
      const resp = await this.apiClient.post<Metadata>(`${this.API_METADATA}/file`, formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          },
          onUploadProgress: onUploadProgress
        })
      return resp.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error("error uploading file " + error.response.status + " " + error)
      }
      throw new Error("error uploading file " + error)
    }
  }

  getMetadataFromFile = async (filePath: string) => {
    try {
      const response = await this.apiClient.get<Metadata>(`${this.API_METADATA}/file`, {
        params: {
          filepath: filePath,
        }
      });
      return response.data;
    }
    catch (error) {
      if (axios.isAxiosError(error) && error.response) {
      }
      throw new Error("error metadata from path " + error)
    }
  }



}

export default new DataService()
