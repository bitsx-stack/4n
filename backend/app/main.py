from fastapi import FastAPI
from api import menu
from core.middleware import DBSessionMiddleware
from core.database import init_db
from api import auth, user, client, vendor,  category_type, category, store, imei, permission, transaction, purchase
from fastapi.middleware.cors import CORSMiddleware


"""
start fastapi application
"""
app = FastAPI(
    title="X-WING API",
    version="1.0.0",
    description="APIs for XWING Application"
    )


# Allowed origins
origins = [
    "*",   # React app
    # add your domain here when deploying
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],        # allow all HTTP methods
    allow_headers=["*"],        # allow all headers
)



"""
create db tables
"""
init_db()

"""
add all middlewares
"""
app.add_middleware(DBSessionMiddleware)


"""
register all routes
"""
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(client.router)
app.include_router(vendor.router)
app.include_router(category_type.router)
app.include_router(category.router)
app.include_router(store.router)
app.include_router(imei.router)
# app.include_router(permission.router)

from api import payment, transfer, stock_request, sale, customer
app.include_router(transaction.router)
app.include_router(purchase.router)
# app.include_router(payment.router)
app.include_router(transfer.router)
app.include_router(stock_request.router)
app.include_router(sale.router)
app.include_router(customer.router)
app.include_router(menu.router)

