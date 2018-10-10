import os
import peewee
import shelve
import sys

from 

sys.path.insert(0, os.getcwd())
try:
    import planarally_old as planarally
    import auth
except ImportError:
    print("You have to run this script from within the same folder as the save file.")
    print("E.g.: python ../scripts/convert/1_to_2.py")
    sys.exit(2)


def convert(save_file):
    with shelve.open(save_file, "c") as shelf:
        

if __name__ == "__main__":
    save_file = "planar.save"
    if len(sys.argv) == 2:
        save_file = sys.argv[1]
    convert(save_file)
