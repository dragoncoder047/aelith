interface Song {
    id: string;
    title: string;
    author: string;
    tags: string[];
}

const all_songs = [];

export function addSong(song: Song) {
    all_songs.push(song);
}

// TODO: play and pause songs
