import os
import shelve
import sys

sys.path.insert(0, os.getcwd())
try:
    import planarally
except ImportError:
    print("You have to run this script from within the same folder as the save file.")
    print("E.g.: python ../scripts/convert/1_to_2.py")
    sys.exit(2)

TARGETTED_SAVE_FORMAT = 1
EXIT_SAVE_FORMAT = 2

def convert(save_file):
    with shelve.open(save_file, "c") as shelf:
        if 'save_version' in shelf and shelf['save_version'] != TARGETTED_SAVE_FORMAT:
            print("This conversion script is meant to convert from save format {} to {}. Provided file is {}".format(
                TARGETTED_SAVE_FORMAT, EXIT_SAVE_FORMAT, shelf['save_version']))
            sys.exit(2)
        rooms = shelf['rooms']
        for room in rooms:
            rooms[room].notes = {}
        shelf['rooms'] = rooms
        shelf['save_version'] = EXIT_SAVE_FORMAT

if __name__ == "__main__":
    convert("planar.save")
