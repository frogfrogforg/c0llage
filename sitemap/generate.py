# usage: python3 generate.py

# minor TODO: visually identify links that are inside draggable-frames

from bs4 import BeautifulSoup
from urllib.parse import urljoin
import pydot
import os

def urlbase(url):
    return urljoin(url, '/')

def normjoin(path1, path2):
    return os.path.normpath(os.path.join(path1, path2))

def crawl(startfile, include_external=False, include_iframe=False):
    graph = pydot.Dot('my_graph', graph_type='digraph')

    seen_paths = set()

    to_process = [(startfile, None, None)]

    # special color for start node:
    graph.add_node(pydot.Node(startfile, fontcolor='red', color='red'))
    graph.set_root(startfile)

    while len(to_process) > 0:
        (this, referer, raw_href) = to_process.pop();
        seen_paths.add(this)
        try:
            html = BeautifulSoup(open(this).read(), features='html.parser')
        except FileNotFoundError as e:
            print(f"!! Broken link in {referer}: {raw_href}")
            continue

        tags = ['a']
        iframe_tags = ['iframe', 'd-iframe']
        if include_iframe: tags += iframe_tags

        for el in html.find_all(tags):
            is_iframe = el.name in iframe_tags

            href = el.get('src' if is_iframe else 'href')
            # href is relative to `this`

            if ((not href) or href.startswith('#')):
                continue

            if (not href.startswith("http")):
                # internal link, normalize path & continue traversing
                neighbor = normjoin(os.path.dirname(this), href)
                if (not neighbor.endswith('.html')):
                    # kind of a hack to handle links like "<...>/keyboard", where the server still returns keyboard/index.html
                    neighbor = normjoin(neighbor, 'index.html') 

                if (not neighbor in seen_paths):
                    to_process.append((neighbor, this, href))

            elif include_external:
                # external link, just show domain for simplicity
                neighbor = urlbase(href)
                # draw as box instead of circle
                graph.add_node(pydot.Node('"'+neighbor+'"', shape='rect'))

            e = pydot.Edge(this, neighbor)
            if (is_iframe):
                e.set_style("dotted")
            graph.add_edge(e)

    return graph

g = crawl("../gatherings/forest/welcome.html")
g_extended = crawl("../gatherings/forest/welcome.html", include_external=True, include_iframe=True) # kinda redundant but simplest way

g.set_overlap(False)
g_extended.set_overlap(False)

# options: "dot", "neato", "fdp", "sfdp", "twopi", "circo"
# https://graphviz.org/
prog = "neato" # seems to work best without much tweaking 
extended_prog = "dot" # cleaner

g.write_svg("sitemap.svg", prog=prog)
g.write_png("sitemap.png", prog=prog)

g_extended.write_svg("sitemap-extended.svg", prog=extended_prog)
g_extended.write_png("sitemap-extended.png", prog=extended_prog)