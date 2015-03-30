# Autocomplete Archive: Images Search

MFA Design and Technology, Parsons The New School for Design

**Thesis Studio 2** | Faculty: Sven Travis and Loretta Wolozin

**Data Structures** | Faculty: Aaron Hill

Spring, 2015

This project is part of the [Autocomplete Archive](https://github.com/gianordoli/autocomplete_archive).

This script changes the data structure from:

```
  {
    "date": "2015-02-19T02:50:26.452Z",
    "service": "web",
    "domain": "google.ad",
    "language": "ca",
    "letter": "a",
    "results": [
      "amazon",
      "ara",
      "as",
      "atri",
      "aliexpress",
      "atrapalo",
      "abacus",
      "abc",
      "antena 3",
      "aeat"
    ]
  },
```

To:

``` 
  {
	"date": "2015-02-19T02:50:26.452Z",   
    "service": "web", 
    "language": "ca", 
    "language_a_name":"Catalan", 
    "letter": "a", 
    "query": "amazon", 
    "ranking": 0 
  },
```
