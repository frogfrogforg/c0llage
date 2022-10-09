# usage: python3 generate.py

# minor TODO: visually identify links that are inside a-dumplings
from pydoc import describe
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import pydot
import os
import json
import networkx as nx

# create a python object for node and edge metadata
def addForestPlace(forest, name, description):
    forest[name] = {
        "description": description,
        "paths": []
    }

def addForestPath(forest, origin, destination, description=''):
    if origin not in forest.keys():
        print("[error] origin " + origin + "not found in graph")
        return

    forest[origin]["paths"].append({
        "description": description,
        "destination": destination
    })

def urlbase(url):
    return urljoin(url, '/')

def normjoin(path1, path2):
    return os.path.normpath(os.path.join(path1, path2))

def template_file(file):
    # x.html -> x.p.html
    return file[:-5]+".p.html"

def crawl(startfile, url_root, include_external=False, include_iframe=False, draw_images=False, relative_pathnames=False):
    graph = pydot.Dot('my_graph', graph_type='digraph')
    graphObj = {}
    forestMap = {}

    seen_paths = set()

    to_process = [(startfile, None, None)]

    # special color for start node:
    graph.add_node(pydot.Node(startfile, fontcolor='red', color='red'))
    graph.set_root(startfile)

    while len(to_process) > 0:
        (this, referer, raw_href) = to_process.pop()
        seen_paths.add(this)
        if os.path.exists(this):
            html = BeautifulSoup(
                open(this, encoding="utf8").read(), features='html.parser')
        elif os.path.exists(template_file(this)):
            html = BeautifulSoup(
                open(template_file(this), encoding="utf8").read(), features='html.parser')
        else:
            print(f"!! Broken link in {referer}: {raw_href}")
            continue

        tags = ['a']
        iframe_tags = ['iframe', 'd-iframe']
        if include_iframe:
            tags += iframe_tags

        n = pydot.Node('"'+this+'"', shape='rect')

            # Find the background element:
        background = html.find("img", {"class": "background"})
        description = ""
        if background:
            src = background.get('src')
            description = background.get('alt')
            rel_src = normjoin(os.path.dirname(this), src)
            # for some reason relative pathnames don't seem to work with graphviz
            abs_src = normjoin(os.getcwd(), rel_src)
            # print(abs_src)
            if not os.path.exists(abs_src):
                print("missing image:", abs_src)

            # this syntax is so fucked lol
            # https://graphviz.org/doc/info/shapes.html

            if draw_images:
                n.set_label(f"""<<TABLE BORDER="0" CELLBORDER="0" >
                    <TR><TD  WIDTH="200.0" HEIGHT="200.0" FIXEDSIZE="TRUE"><IMG SRC="{rel_src if relative_pathnames else abs_src}"/></TD></TR>
                    <TR><TD>{this}</TD></TR>
                    </TABLE>>""")

                # n.set_image(abs_src)
                # n.set_imagescale("both")
                # n.set_imagepos("tc")
                # n.set_labelloc("b")
                # n.set_fixedsize("true")
                # #n.set_label(this)
                # n.set_height("1.0")
                # n.set_width("1.0")

                # n.set_height(1)

        graph.add_node(n)
        addForestPlace(forestMap, this, description)

        for el in html.find_all(tags):
            is_iframe = el.name in iframe_tags

            href = el.get('src' if is_iframe else 'href')
            # href is relative to `this`

            if (not href) or href.startswith('#') or 'javascript:void(0)' in href:
                continue

            if (not href.startswith("http")):
                # internal link, normalize path & continue traversing
                if (href.startswith("/")):
                    # handle absolute path
                    # probably a better way to do this
                    neighbor = url_root + href
                else:
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
                n = pydot.Node('"'+neighbor+'"', shape='ellipse')
                graph.add_node(n)
            else:
                continue

            e = pydot.Edge(this, neighbor)

            if (is_iframe):
                e.set_style("dotted")

            graph.add_edge(e)
            addForestPath(forestMap, this, neighbor, el.get("title") or "")

    return graph, forestMap

def CreateDistanceMapJS(g):
    G = nx.nx_pydot.from_pydot(g)
    distances = list(nx.all_pairs_shortest_path_length(G))
    dists = {}
    for d in distances:
        dists[d[0]] = d[1]
    dist_json = json.dumps(dists)
    dist_json = dist_json.replace("\\\\", "/",).replace(".html", "").replace("forest/", "/forest/")

    # max_dist = nx.diameter(G) sadly the graph is not strongly connected so this doesnt work
    max_dist = -1
    for v in dists.values():
        for dist in v.values():
            if max_dist < dist:
                max_dist = dist

    with open("sitemap/mapDistances.js", "w") as outfile:
        outfile.write("const kDistances = ")
        outfile.write(dist_json)
        outfile.write("\n")

        outfile.write("export const kMaxDistance = ")
        outfile.write(str(max_dist))
        outfile.write("\n")

        outfile.write("export function Distance(start, end) {\n")
        outfile.write("    if(!(start in kDistances)) {\n")
        outfile.write("        console.log(`start ${start} not in distance graph`)\n")
        outfile.write("        return kMaxDistance\n")
        outfile.write("    }\n")
        outfile.write("    const startDistances = kDistances[start]\n")
        outfile.write("    if(!(end in startDistances)) {\n")
        outfile.write("        console.log(`end ${end} not in distance graph`)\n")
        outfile.write("        return kMaxDistance\n")
        outfile.write("    }\n")
        outfile.write("    return startDistances[end]\n")
        outfile.write("}\n")

def CreateMapJS(forestMap):
    json_map = json.dumps(forestMap)
    json_map = json_map.replace("\\\\", "/",).replace(".html", "").replace("forest/", "/forest/")
    with open("sitemap/map.js", "w") as outfile:
        outfile.write("export const Map = ")
        outfile.write(json_map)

g, f = crawl("forest\\welcome.html", "..", draw_images=False)
CreateDistanceMapJS(g)
CreateMapJS(f)
g_images, _ = crawl("forest\\welcome.html", "..",
                 draw_images=True, relative_pathnames=False)
g_extended, _ = crawl("forest\\welcome.html", "..",
                   include_external=True, include_iframe=True)  # kinda redundant but simplest way


g.set_overlap(False)
g_images.set_overlap(False)
g_images.set_mindist(50)
g_images.set_nodesep(1)
g_extended.set_overlap(False)

# options: "dot", "neato", "fdp", "sfdp", "twopi", "circo"
# https://graphviz.org/
prog = "circo"  # seems to work best without much tweaking
extended_prog = "dot"  # simple tree, looks cleaner for complex graph

g.write_svg("sitemap/sitemap.svg", prog=prog)
g.write_png("sitemap/sitemap.png", prog=prog)
# can't render images in svg (graphviz can't seem to deal with relative pathnames)
g_images.write_png("sitemap/sitemap-illustrated.png", prog=prog)

g_extended.write_svg("sitemap/sitemap-extended.svg", prog=extended_prog)
g_extended.write_png("sitemap/sitemap-extended.png", prog=extended_prog)
