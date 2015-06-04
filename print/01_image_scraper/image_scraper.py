# -*- coding: utf-8 -*-

from GoogleScraper import scrape_with_config, GoogleSearchError
import json                 # read/write json
from pprint import pprint   # Pretty print
import sys                  # Exit script in case Google starts blocking it
import chardet
# import re
import time

encodings = {
    'Croatian': 'iso-8859-2',
    'Polish': 'iso-8859-2',
    'Slovak': 'iso-8859-2',
    'Czech': 'iso-8859-2',
    'Swedish': 'iso-8859-1',
    # 'Turkish': 'iso-8859-5',
    'Lithuanian': 'iso-8859-4'
}

exceptions = ['youtube', 'ytmg.com', 'wp-content', 'wallpaper', 'promo.capitalradio.co.uk', 'deviantart', 'tsquirrel', 'compass.xbox.com', 'xboxlive.com', 'freehighresolutionimages.org', 'widehdwalls.com', 'nextranks.com', '?', 'football.co.uk', 'wordpress', 'www1.wdr.de', 'feelgrafix.com', 'dreamatico.com', 'img4.allvoices.com', 'funmozar', 'jogandoonline.com.br', 'pinterest', 'bedroomidea', 'valentinescards', 'onepiece.com', 'fansshare.com', 'viraldot.com', 'sharecdn.com', 'coverium.com', 'handson.provocateuse', 'no.hairdresser-models.eu', 'www.web-kuchi.ch', 'media1.gameinformer.com']
extensions = ['.jpg', '.jpeg', '.gif', '.png', '.tif', '.tiff', '.bmp'];

def checkExtension(string):
    string = string.lower()
    extension = None
    for i in range(len(extensions)):
        # if extensions[i] in string:
        if string.endswith(extensions[i]):
            extension = extensions[i]
            break
    return extension

def containsException(string):
    string = string.lower()
    for i in range(len(exceptions)):
        if exceptions[i] in string:
            return True
            break
    return False

def fixDoubleEscape(string):
    # new_string = string.replace('2520', '20')
    new_string = string.replace('%25', '%')    
    return new_string

def decodeString(string, language_name):
    b = bytes(string, 'utf-8')
    # encoding = chardet.detect(b)['encoding']
    # new_string = b.decode(encoding, 'strict')
    new_string = b.decode(encodings[language_name], 'strict')
    print(new_string)
    return new_string    

# Configuring the scraper
# See in the config.cfg file for possible values
config = {
    'SCRAPING': {
        # 'keyword': 'ma',
        'search_engines': 'google, yahoo',
        'search_type': 'image',
        'num_pages_for_keyword': 1,
        'num_results_per_page': 20,
        'num_workers': 4,
        'scrape_method': 'selenium'
        # 'scrape_method': 'http'
    },
    'GLOBAL': {
        'do_caching': 'True'
    },
    'SELENIUM': {
    #     # this makes scraping with browsers headless
    #     # and quite fast.
        # 'sel_browser': 'phantomjs'
        # 'sel_browser': 'Firefox'    
    }    
}

# Loading the json file
jsonFile = open('../db/images_2015_03_24.json', 'r')
data = json.load(jsonFile)
jsonFile.close()
# pprint(data)
# print(len(data))


# query = data[i]['query'] + ' language:' + data[i]['language_code']
# if data[i]['language_code'] == 'pt-BR':
#     query = data[i]['query'] + ' language:pt'

for i in range(len(data)):
# for i in range(len(data) - 1, 0, -1):

    if(data[i]['language_name'] == 'Vietnamese'):

        # Begin scraping only if:
        # * the record doesn't have an url yet
        # * or it contains Google's blocked address
        if (not 'url' in data[i]) or ('/url?q=' in data[i]['url']):            

            query = data[i]['query']
            config['SCRAPING']['keyword'] = query

            print(data[i]['language_name'])        
            print('>>>>>> Scraping: ' + query)        

            try:
                search = scrape_with_config(config)
                print(search.serps)
                # print(len(search.serps[0].links))
                # print(len(search.serps[1].links))

                # No results?
                if (len(search.serps[0].links) and len(search.serps[1].links)) == 0:
                # if len(search.serps[0].links) == 0:
                    
                    # If it is Croatian, Polish, or Slovak try to change the encoding
                    if data[i]['language_name'] in encodings:
                        alt_query = decodeString(query, data[i]['language_name'])
                        config['SCRAPING']['keyword'] = alt_query
                        print('>>>>>> Scraping: ' + alt_query)
                        search = scrape_with_config(config)
                        print(search.serps)

                list_of_links = []
                
                if (len(search.serps[0].links) or len(search.serps[1].links)) > 0:

                # if len(search.serps[0].links) > 0:
                
                    if len(search.serps[0].links) > 0:
                        list_of_links = search.serps[0].links
                    else:
                        list_of_links = search.serps[1].links
                    
                    # print(list_of_links);

                    for j in range(len(list_of_links)):
                        
                        print(j)

                        if checkExtension(list_of_links[j].link) != None and not containsException(list_of_links[j].link):
                            link = list_of_links[j].link
                            break

                    # If Google starts blocking, exit script
                    if '/url?q=' in link:
                        sys.exit("Error message")

                    # URL escape characters are being encoded twice
                    # %20 > %2520
                    link = fixDoubleEscape(link)
                    print("********" + link)

                    # If not, change the data dict and save it to the JSON file
                    data[i].setdefault('url', link)
                    print(data[i])

                    print('>>>>>>>>>>>>>>>>> SAVING <<<<<<<<<<<<<<<<<')
                    jsonFile = open('../db/images_2015_03_24.json', 'w+')
                    jsonFile.write(json.dumps(data, indent=4))
                    jsonFile.close() 
                    time.sleep(5)           

            except GoogleSearchError as e:
                print(e)