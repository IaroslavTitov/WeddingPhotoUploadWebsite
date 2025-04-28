FROM node:22-alpine

WORKDIR /webapp

COPY package.json yarn.lock ./

RUN yarn

COPY . .

# Ensure needed arguments are passed in
ARG WEBSITE_TITLE
ARG WEBSITE_DESCRIPTION
RUN test -n "$WEBSITE_TITLE" || (echo "WEBSITE_TITLE not set" && false)
RUN test -n "$WEBSITE_DESCRIPTION" || (echo "WEBSITE_DESCRIPTION not set" && false)

RUN NEXT_PUBLIC_WEBSITE_TITLE=$WEBSITE_TITLE NEXT_PUBLIC_WEBSITE_DESCRIPTION=$WEBSITE_DESCRIPTION yarn build

EXPOSE 3000

CMD ["yarn", "start"]