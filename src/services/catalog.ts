import { apiClient } from "@/lib/api-client";
import type { MovieDetails, MovieSummary } from "@/types/catalog";

interface MovieListResponse {
  page: number;
  totalPages: number;
  totalResults: number;
  results: MovieSummary[];
}

interface MovieDetailsResponse {
  movie: MovieDetails;
}

export function getNowPlaying(page = 1) {
  return apiClient.get<MovieListResponse>(`/api/catalog/now-playing?page=${page}`);
}

export function searchMovies(query: string, page = 1) {
  return apiClient.get<MovieListResponse>(
    `/api/catalog/search?query=${encodeURIComponent(query)}&page=${page}`,
  );
}

export function getMovieDetails(tmdbId: number) {
  return apiClient.get<MovieDetailsResponse>(`/api/catalog/movies/${tmdbId}`);
}
