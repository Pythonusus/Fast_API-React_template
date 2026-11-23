---
name: system-map
description: >-
  Draw a plain-text map of how files in this repository connect for one
  system: what each file keeps, what happens there, and where each step
  goes. Manual only. Invoke with /system-map.
disable-model-invocation: true
---

# System map

Draw one plain-text map of a system the user names. The map is for a person who will reread it later and will not remember function names. They need the files, what each file holds, and where each handoff goes.

The shape is defined here. Do not look for a sample diagram in the project. Do not switch to Mermaid, boxes-and-arrows images, or a file tree.

## Before drawing

Read the code for the system the user named. Open the files that actually take part. A map that invents a file or a hop is worse than a shorter map.

Follow a path a person takes. A list of folders is not the map.

## What to return

Return one fenced `text` block. A sentence before it is enough to say which system this is. Do not add a second diagram for a side topic they did not ask about.

Edit a doc only when they ask to put the map there. Then add a short heading and one sentence, then the same text block, under the section they name. Leave the rest of the file alone.

## How a box is written

A file box starts with the path from the repository root, using the folders this project actually has. The following lines say what that file keeps, or what happens when a request passes through it. Plain words. No function names, method names, or class names. The reader does not remember those on a later visit.

A place that is not a file still gets a box: a database, a file store, a browser, a cookie. Say what is stored there.

Two or three files that share one parent sit on one row. Their "keeps" lines stay under their own path. Use spaces so the columns do not crash into each other. More than three siblings get their own rows.

## How an arrow is written

An arrow is the handoff. The label says what moves and where it arrives. A verb alone is not enough. "Uploaded" does not say where. "Stored in the file store" does.

```text
the form
        |
        | a chosen file is stored in the file store right away
        v
src/upload.py
checks the login
stores the file and a row that is not attached yet
```

## How a system with several paths is split

Put the shared pieces first. Then one section per path you actually found, with a short heading and a line of dashes. Name the sections after those paths.

A branch is a `+` with arrows down to the next boxes.

## Shape sample

This sample shows the shape only. The paths are not files to open, and the section names are not a list to copy. Replace every line with what you found in the project.

```text
src/settings.py
keeps the limits the other files read
        |
        +---------------------------+---------------------------+
        |                           |                           |
        v                           v                           v
src/models.py                 src/api_shapes.py           src/storage.py
keeps the tables              keeps the JSON shape        keeps the file helpers
                              the API returns             and the public file URL
        |
        v
the database and the file store
a deleted row also deletes its related rows
the files themselves are removed after that delete is saved

one path
--------

the screen the person uses
        |
        | what moves, and where it arrives
        v
src/screen.py
what happens on that screen
        |
        +---------------------------+---------------------------+
        |                           |
        v                           v
first outcome                 second outcome
src/one.py                    src/two.py
what this branch does         what this branch does

other path
----------

src/reader.py
reads the saved rows and returns them to the page
```

## What to leave out

Leave out a file that is not on the path. Leave out CSS and test files unless the user asked how the screen looks or how it is tested. Leave out a route the running product does not use, unless they asked about that route.

If you are unsure where something is stored, read the code again. Do not guess a store, a table, or a cookie.
