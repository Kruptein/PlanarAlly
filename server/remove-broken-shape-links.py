import sys

from src.db.all import Shape


def run(delete: bool = False):
    found = False
    print("Starting loop through all shapes")
    print()
    for shape in Shape.select():
        try:
            shape.subtype
        except Exception as e:
            found = True
            if delete:
                shape.delete_instance(True)
                print(f"Deleted {shape.uuid}")
                print()
            else:
                print(e)
                print(shape.uuid, shape.type_, repr(shape.layer))
                print()
    print("Finished loop through all shapes")
    if not delete and found:
        print()
        print("Run with `delete` argument to remove the broken shapes.")
    if not found:
        print()
        print("No broken shapes found.")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "delete":
        run(delete=True)
    else:
        run(delete=False)
