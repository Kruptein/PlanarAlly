import os
import shelve
import sys

sys.path.insert(0, os.getcwd())
try:
    import planarally
    import auth
except ImportError:
    print("You have to run this script from within the same folder as the save file.")
    print("E.g.: python ../scripts/convert/1_to_2.py")
    sys.exit(2)

TARGETTED_SAVE_FORMAT = 2
EXIT_SAVE_FORMAT = 3

def convert(save_file):
    with shelve.open(save_file, "c") as shelf:
        if 'save_version' in shelf and shelf['save_version'] != TARGETTED_SAVE_FORMAT:
            print("This conversion script is meant to convert from save format {} to {}. Provided file is {}".format(
                TARGETTED_SAVE_FORMAT, EXIT_SAVE_FORMAT, shelf['save_version']))
            sys.exit(2)
        user_map = shelf['user_map']
        for u, user in user_map.items():
            user.asset_info = {'files': [], 'folders': {}}
            user_map[u] = user
        shelf['user_map'] = user_map
        shelf['save_version'] = EXIT_SAVE_FORMAT

if __name__ == "__main__":
    convert("planar.save")
