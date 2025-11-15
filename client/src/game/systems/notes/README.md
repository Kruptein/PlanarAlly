# Note System

Notes are markdown-aware text blobs with some extra properties:

- a title
- optional tags
- optional shape links
- optional campaign/location links
- user access configuration
- additional triggers/visuals if linked to shapes

Because notes can be used in a variety of ways, it's likely to have a lot of notes.
For this reason the notes are actually not all loaded on campaign opening.
Instead all notes linked to a shape are loaded, and all other notes are fetched from the server when requested.

The NoteManager is the main access point for users and uses a server based search/filter/pagination flow.
This means that at all times the set of notes loaded in the note system are only representative of the actual downloaded notes and not all notes.

To reduce the load on the server we ideally only do a search query if we know there are changes in the data,
this is why all note system calls will also set a `refresh` state property when relevant, so that the NoteManager knows its data is out of date.
Similary the filter options are only refreshed in this manner.
