import pysftp
from const import *


def connect():
    # Mettre clé SSH en HostKey
    cnopts = pysftp.CnOpts()
    cnopts.hostkeys = None
    conn = pysftp.Connection(
        HOST, username=ID, password=PASSWORD, port=PORT, cnopts=cnopts)
    conn.cd('Documents/PoltergeistBot/database')
    return conn


conn = connect()


def put_in(file_name: str):
    try:
        conn.put(file_name)
        print(f"Export de \"{file_name}\" réussi")
    except:
        print(
            f"Une erreur est survenue pendant l'import de \"{file_name}\"")


def get_from(file_name: str):
    try:
        conn.get(file_name)
        print(f"Import de \"{file_name}\" réussi")
    except:
        print(
            f"Une erreur est survenue pendant l'import de \"{file_name}\"")


if __name__ == '__main__':
    from sys import argv, exit

    def pr_msg():
        print("python main.py [put/get] [fichier]")
        exit(1)

    if len(argv) == 1 or len(argv) == 2 or (argv[1] not in ['put', 'get']):
        pr_msg()
    else:
        for el in argv[2:]:
            if argv[1] == 'put':
                put_in(el)
            else:
                get_from(el)
