import glob
import os
from random import choice, randint, shuffle

IMAGE_DIR = "./images"
TEMPLATE_FILE = "./dumplings.html_template"
OUTPUT_FILE = "./dumplings.html"
BODY_TEMPLATE_STR = r"<!-- %DUMPLINGS_GO_HERE% -->"

images = glob.glob(IMAGE_DIR+"/*");
#images.sort(key=os.path.getmtime)
shuffle(images)

def make_review():
  adjectives = ["chewy", "tangy", "sweet", "delicious", "tender", "soft", "crunchy"]
  shuffle(adjectives)
  return " ".join([adjectives.pop().capitalize(), choice(["yet", "but", "and"]), adjectives.pop()]) + "."

def blogpost(image_fn):
  if image_fn.endswith("COSMODUMPLING.png"):
    location = '<a href="/gatherings/forest/420cosmodrome.html">THE COSMODROME</a>'
    rating = "🐸"*3
    review = "Would not recommend...."
  else:
    location = choice(["New York City"])
    rating = "⭐️"*randint(1,5)
    review = make_review()
  return f"""
    <div class="post">
      <img class="image" src="{image_fn}">
      <br>
      Location: {location}
      <br>
      Rating: {rating}
    </div>
  """


body = "\n".join([blogpost(image) for image in images])

template = open(TEMPLATE_FILE).read()
output = template.replace(BODY_TEMPLATE_STR, body)

open(OUTPUT_FILE, 'w').write(output)
