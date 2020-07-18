def connect():
    import paramiko
    from const import HOST, ID, PASSWORD, PORT

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.load_host_keys('key.pem')

    ssh.connect(HOST, username=ID, password=PASSWORD, port=PORT)
    sftp: paramiko.SFTPClient = ssh.open_sftp()
    sftp.chdir('Documents/PoltergeistBot/database')

    return sftp


conn = connect()


def reverse_string(s: str) -> str:
    return s[::-1]


def format_name(file_name: str, overwrite: bool, p: bool = False) -> str:
    from os import path
    n = f'../{file_name}'

    if not overwrite and p and file_name in conn.listdir():
        # p = put_in
        ext, name = reverse_string(file_name).split('.', 1)
        ext, name = reverse_string(ext), reverse_string(name)
        n = f'../{name} copy.{ext}'
    elif not overwrite and path.exists(f'./{file_name}'):
        ext, name = reverse_string(file_name).split('.', 1)
        ext, name = reverse_string(ext), reverse_string(name)
        n = f'../{name} copy.{ext}'

    return n


def put_in(file_name: str, overwrite: bool):
    name = format_name(file_name, overwrite, p=True)
    conn.put(file_name, name)
    print(f"Export de \"{file_name}\" réussi")


def get_from(file_name: str, overwrite: bool):
    name = format_name(file_name, overwrite)
    conn.get(file_name, name)
    print(f"Import de \"{file_name}\" réussi")


if __name__ == '__main__':
    from sys import argv, exit

    def pr_msg():
        print("python main.py [ecraser (True/False)] [put/get] [fichier]")
        exit(1)

    if len(argv) == 2 or len(argv) == 3 \
            or (argv[2] not in ['put', 'get']) \
            or (argv[1] not in ['True', 'False']):
        pr_msg()
    else:
        for el in argv[3:]:
            if argv[2] == 'put':
                put_in(el, argv[1] == "True")
            else:
                get_from(el, argv[1] == "True")
