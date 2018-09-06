from hashlib import sha256
from zerodb.afgh import crypto

alice = crypto.Key.make_priv()
bob = crypto.Key.from_passphrase("Bob's passphrase")
test_message = sha256("Hello world").digest()


def test_encrypt_decrypt():
    emsg = alice.encrypt(test_message)
    assert isinstance(emsg, basestring)
    assert alice.decrypt_my(emsg) == test_message


def test_reencrypt():
    emsg = alice.encrypt(test_message)
    remsg = alice.re_key(bob).reencrypt(emsg)
    assert bob.decrypt_re(remsg) == test_message


def test_load_priv():
    dump = alice.dump_priv()
    assert isinstance(dump, basestring)
    assert crypto.Key.load_priv(dump).priv == alice.priv


def test_load_pub():
    dump = alice.dump_pub()
    assert isinstance(dump, basestring)
    assert crypto.Key.load_pub(dump).pub == alice.pub


def test_reencryption_full():
    # Alice encrypts message and makes reencryption key fpr Bob
    emsg = alice.encrypt(test_message)
    re_key = alice.re_key(bob.dump_pub())
    re_key_dump = re_key.dump()

    # Re-encrypt for Bob
    re_key = crypto.ReKey.load(re_key_dump)
    re_msg = re_key.reencrypt(emsg)

    # Bub decrypts message
    assert bob.decrypt_re(re_msg) == test_message
