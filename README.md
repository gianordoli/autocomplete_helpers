# Autocomplete Archive: Helpers

MFA Design and Technology, Parsons The New School for Design

**Thesis Studio 2** | Faculty: Sven Travis and Loretta Wolozin

**Data Structures** | Faculty: Aaron Hill

Spring, 2015

This project is part of the [Autocomplete Archive](https://github.com/gianordoli/autocomplete_archive).

This repo contains some helper scripts to preprocess the data.

---

## Print

Some scripts to support the automated generation of prints.

### 01_image_scraper

Given a list of words, searches for them on Google Images and grabs the url of the first result. Reads from and save to JSON files. Written in Python, requires the [GoogleScraper](https://github.com/NikolaiT/GoogleScraper) module.

### 02_image_saver

Downloads a list of images based on a list of urls. Reads the JSON file saved by **01_image_scraper**. Written in Node.js.

## Online

Some scripts to support the data processing for the final website.

### 01_results_to_query

The original data is grouped by letter — the input used to query Google Autocomplete. Each record has a list of 10 predictions. This script splits the lists, creating one record for each prediction. Reads from the MongoDB database **autocomplete**, collections **records**, and saves in the database **thesis**, collection **records**. Written in Node.js.

### 02_image_and_youtube_api

Given a list of queries, searches for them and grabs the url of the first result. For videos, the script uses the Youtube API. For images, Bing search. Reads from the MongoDB database **thesis**, collection **records**, and saves to the collections **images** or **youtube**.

## Data

Help double-check and compare data.



