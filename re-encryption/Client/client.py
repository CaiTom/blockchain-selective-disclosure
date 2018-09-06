from zerodb.afgh import crypto
import os.path
from os import getcwd
import pickle
import requests
import base64
import sys
import json

def getMyKey(my_id):
    my_key = crypto.Key.from_passphrase(my_id)

    # privkey_path = os.path.join(getcwd(), 'Client', 'Users', my_id+'_priv.pem')
    # pubkey_path = os.path.join(getcwd(), 'Client', 'Users', my_id+'_pub.pem')

    # with open(privkey_path, 'rb') as f:
    #     my_key = crypto.Key.load_priv(f.read())
    # with open(pubkey_path, 'rb') as f:
    #     my_key.load_pub(f.read())

    return my_key

# Encrypt file from the path. Both param are str
def encrypt(my_id, file_path):

    # privkey_path = os.path.join(getcwd(), 'Client', 'Users', my_id+'_priv.pem')
    # pubkey_path = os.path.join(getcwd(), 'Client', 'Users', my_id+'_pub.pem')
    # # Check if the key pair has been generated
    # if not os.path.isfile(privkey_path):
 
    #     my_key = crypto.Key.from_passphrase(my_id) # This can be more secure
        
    #     with open(privkey_path, 'wb') as f:
    #         f.write(my_key.dump_priv())
    #     with open(pubkey_path, 'wb') as f:
    #         f.write(my_key.dump_pub())
        
    #     # Send the public key to the server
    #     url = 'http://localhost:9999/register'
    #     data = {'id' : my_id, 'pubkey' : base64.b64encode(my_key.dump_pub())}
    #     r = requests.post(url, data=data)

    
    # else:
    #     my_key = getMyKey(my_id)
    my_key = getMyKey(my_id) ####

    # Load the file to be encrypted
    file = open(file_path, 'rb')
    filename = os.path.basename(file_path)
    content = file.read()
    file.close()

    # Split the file content into array in order to encrypt
    data_arr = []
    head = 0
    tail = 100
    while head < len(content):
        while tail <= len(content) and (content[tail-1] == 0 or content[tail] == 0):
            tail += 1
        data_arr.append(content[head:tail])
        head = tail
        tail += 100

    # Encrypt the file
    encrypted_data = []
    for i in range(len(data_arr)):
        # if i%100 == 0:
        #     print(i, '/', len(data_arr))
        encrypted_data.append(base64.b64encode(my_key.encrypt(data_arr[i])))

    # Export the file locally
    pickle.dump(encrypted_data, open('./Client/Data/'+my_id+'.'+filename+'.pickle', 'wb'))
    sys.stdout.write(os.path.join(getcwd(), 'Client', 'Data', my_id+'.'+filename+'.pickle'))
    sys.stdout.flush()

    return os.path.join(getcwd(), 'Client', 'Data', my_id+'.'+filename+'.pickle')

# Decrypt last function
# def decrypt_my(my_id, file_path):
#     my_key = getMyKey(my_id)
#     print('Loading encrypted_data')
#     with open(file_path, 'rb') as f:
#         encrypted_data = pickle.load(f)
#     filename = os.path.basename(file_path)
#     print(filename, 'Loaded')
#     decrypted_data = []
#     for i in range(len(encrypted_data)):
#         try:
#             decrypted_data.append(my_key.decrypt_my(encrypted_data[i]))
#         except TypeError:
#             print(encrypted_data[i])
#     # Combine the array into a whole file
#     combined_data = b''.join(decrypted_data)
#     with open('./Client/Data/'+filename[:-7], 'wb') as f:
#         f.write(combined_data)
#     return 0 


# Proxy re-encryption with another person's public key
def re_encrypt(my_id, file_path, another_id):
    # # Get the public key from the server
    # print('Gettting', another_id, '\'s public key...')
    # url = 'http://localhost:9999/pubkey'
    # data = {'id' : another_id}
    # r = requests.post(url, data=data)
    # print('The public key is', r.text)
    # another_pubkey = base64.b64decode(r.text)

    my_key = getMyKey(my_id)
    # Totally local
    another_key = getMyKey(another_id) ######
    # pubkey_path = os.path.join(getcwd(), 'Client', 'Users', another_id+'_pub.pem')
    # with open(pubkey_path, 'wb') as f:
    #     f.write(another_key.dump_pub())
    another_pubkey = another_key.dump_pub()#######
    # with open(pubkey_path, 'rb') as f:
    #     another_pubkey = f.read()

    # Compute the re-encryption key
    re_key = my_key.re_key(another_pubkey)

    # Load the file to be re-encrypted
    filename = os.path.basename(file_path)
    with open(file_path, 'rb') as f:
        enc_data = pickle.load(f)


    # # Re-encrypt the file via server
    # print('Asking the server to re-encrypt...')
    # url2 = 'http://localhost:9999/reencrypt'
    # data2 = {'rekey' : base64.b64encode(re_key.dump()), 'encdata' : enc_data}
    # r2 = requests.post(url2, data=data2)
    # # Receive the re-encrypted file and save it locally
    # print('Got the re-encrypted file')
    # reenc_file = json.loads(r2.text)

    reenc_file = []
    for i in range(len(enc_data)):
        # if i%100 == 0:
        #     print(i, '/', len(enc_data))
        original_format = base64.b64decode(enc_data[i])
        reenc_file.append(re_key.reencrypt(original_format))

    pickle.dump(reenc_file, open('./Client/Data/'+another_id+'.'+filename, 'wb'))
    sys.stdout.write(os.path.join(getcwd(), 'Client', 'Data', another_id+'.'+filename))
    sys.stdout.flush()

    return 0

# Decrypt the re-encrypted file
def decrypt_re(my_id, file_path):
    my_key = getMyKey(my_id)
    with open(file_path, 'rb') as f:
        reencrypted_data = pickle.load(f)
    filename = os.path.basename(file_path)
    print(type(reencrypted_data))

    decrypted_data = []
    for i in range(len(reencrypted_data)):
        decrypted_data.append(my_key.decrypt_re(reencrypted_data[i]))
    # Combine the array into a whole file
    combined_data = b''.join(decrypted_data)
    with open('./Client/Data/'+filename[:-7], 'wb') as f:
        f.write(combined_data)

    sys.stdout.write(os.path.join(getcwd(), 'Client', 'Data', filename[:-7]))
    sys.stdout.flush()
    return 0

if __name__ == "__main__":
    from sys import argv
    # print('Re-encryption client starts...')
    if len(argv) < 4:
        print('Undefined')
        exit(1)

    else:
        my_id = argv[1]
        file_path = argv[2]
        another_id = argv[3]
        # When request for encryption
        if another_id == 'encrypt':
            # print('You are ask for first time encryption')
            CODE = encrypt(my_id, file_path)
        # elif another_id == 'decrypt_my':
            # print('You are asking for decrypting encrypted file')
            # CODE = decrypt_my(my_id, file_path)
        elif another_id == 'decrypt_re':
            # print('You are asking for decrypting reencrypted file')
            CODE = decrypt_re(my_id, file_path)
        elif len(another_id) == len('0x6a007fef46433b8f42b284da83c5f7e4ef99f050'):
            # print('You are asking for re-encryption')
            CODE = re_encrypt(my_id, file_path, another_id)
        else:
            # print('I don\'t know what you are talking about')
            CODE = 1

        exit(CODE)
    # me = '0x6a007fef46433b8f42b284da83c5f7e4ef99f050'
    # bob = '0x2a43de76e4aa68ff5f7815e8eb608f9cadca3096'
    # enc_data = encrypt(me, '/Users/CaiChunyu/Downloads/ic.jpg')
    # decrypt(me, enc_data)
    # reencrypted_data = re_encrypt(me, enc_data, bob)
    # decrypt_re(bob, reencrypted_data)

