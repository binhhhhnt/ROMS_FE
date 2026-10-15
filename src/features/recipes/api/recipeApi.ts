import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse, PageResponse } from '@/shared/types/api.types'
import type {
  RecipeResponse,
  BatchUpsertRecipeRequest,
  UpsertRecipeItemRequest,
  RecipeMenuItem,
  RecipeCategory,
} from '@/features/recipes/types/recipe.types'

export const recipeApi = {
  async getRecipe(menuItemId: number): Promise<RecipeResponse> {
    const res = await apiClient.get<ApiResponse<RecipeResponse>>(
      `/api/menu-items/${menuItemId}/recipe`
    )
    return res.data.data
  },

  async replaceRecipe(
    menuItemId: number,
    request: BatchUpsertRecipeRequest
  ): Promise<RecipeResponse> {
    const res = await apiClient.put<ApiResponse<RecipeResponse>>(
      `/api/menu-items/${menuItemId}/recipe`,
      request
    )
    return res.data.data
  },

  async addRecipeItem(
    menuItemId: number,
    request: UpsertRecipeItemRequest
  ): Promise<RecipeResponse> {
    const res = await apiClient.post<ApiResponse<RecipeResponse>>(
      `/api/menu-items/${menuItemId}/recipe/items`,
      request
    )
    return res.data.data
  },

  async updateRecipeItem(
    menuItemId: number,
    ingredientId: number,
    quantityRequired: number
  ): Promise<RecipeResponse> {
    const res = await apiClient.patch<ApiResponse<RecipeResponse>>(
      `/api/menu-items/${menuItemId}/recipe/items/${ingredientId}`,
      { quantityRequired }
    )
    return res.data.data
  },

  async deleteRecipeItem(menuItemId: number, ingredientId: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(
      `/api/menu-items/${menuItemId}/recipe/items/${ingredientId}`
    )
  },

  async getMenuItems(params?: {
    categoryId?: number
    page?: number
    size?: number
  }): Promise<PageResponse<RecipeMenuItem>> {
    const searchParams = new URLSearchParams()
    if (params?.categoryId) {
      searchParams.append('categoryId', params.categoryId.toString())
    }
    if (params?.page !== undefined) {
      searchParams.append('page', params.page.toString())
    }
    if (params?.size !== undefined) {
      searchParams.append('size', params.size.toString())
    }

    const queryStr = searchParams.toString()
    const res = await apiClient.get<ApiResponse<PageResponse<RecipeMenuItem>>>(
      `/api/menu-items${queryStr ? `?${queryStr}` : ''}`
    )
    return res.data.data
  },

  async getCategories(): Promise<PageResponse<RecipeCategory>> {
    const res = await apiClient.get<ApiResponse<PageResponse<RecipeCategory>>>(
      '/api/categories?size=100'
    )
    return res.data.data
  },
}
