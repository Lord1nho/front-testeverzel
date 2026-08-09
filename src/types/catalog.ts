export interface MovieSummary {
  tmdbId: number;
  title: string;
  originalTitle: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string;
  voteAverage: number;
  popularity: number;
  genreIds: number[];
}

export interface MovieGenre {
  id: number;
  name: string;
}

export interface MovieDetails
  extends Omit<MovieSummary, "genreIds"> {
  genres: MovieGenre[];
  runtime: number;
  tagline: string;
}
