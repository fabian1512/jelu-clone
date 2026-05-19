import { createApiClient } from "./apiClientFactory";

class DataService {

  private TOKEN_KEY = 'jelu-token'

  getToken = (): string | null => {
    const token = localStorage.getItem(this.TOKEN_KEY)
    if (token == null) {
      return null
    }
    return token
  }
}

export default new DataService()
