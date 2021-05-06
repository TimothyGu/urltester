#define _POSIX_C_SOURCE 200809L

#include <assert.h>
#include <curl/curl.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include "string_builder.h"

struct json_object {
  struct string_builder builder;
  bool first;
};

static struct json_object new_json_object(void) {
  return (struct json_object){
      .builder = new_string_builder(0),
      .first = true,
  };
}

static void json_append_str(struct string_builder *builder, const char *str) {
  append_char(builder, '"');
  while (*str != '\0') {
    switch (*str) {
      case '"':
        append_str(builder, "\\\"");
        break;
      case '\\':
        append_str(builder, "\\\\");
        break;
      case '\b':
        append_str(builder, "\\b");
        break;
      case '\f':
        append_str(builder, "\\f");
        break;
      case '\n':
        append_str(builder, "\\n");
        break;
      case '\r':
        append_str(builder, "\\r");
        break;
      case '\t':
        append_str(builder, "\\t");
        break;
      default:
        if ((unsigned char)*str < 0x20) {
          append_str(builder, "\\u");
          char buf[10];
          ssize_t len = snprintf(buf, sizeof(buf), "%.2x", *str);
          append_mem(builder, buf, len);
        } else {
          append_char(builder, *str);
        }
        break;
    }
    str++;
  }
  append_char(builder, '"');
}

static void add_key(struct json_object *obj, const char *key,
                    const char *value) {
  assert(key);
  if (obj->first) {
    append_char(&obj->builder, '{');
    obj->first = false;
  } else {
    append_char(&obj->builder, ',');
  }
  json_append_str(&obj->builder, key);
  append_char(&obj->builder, ':');
  if (value) {
    json_append_str(&obj->builder, value);
  } else {
    append_str(&obj->builder, "null");
  }
}

static char *finalize_object(struct json_object *obj) {
  if (obj->first) {
    append_char(&obj->builder, '{');
    obj->first = false;
  }
  append_char(&obj->builder, '}');
  char *buf = release_builder(&obj->builder);
  obj->first = true;
  return buf;
}

static const char *url_strerr(CURLUcode rc) {
  switch (rc) {
    case CURLUE_OK:
      return "OK";
    case CURLUE_BAD_HANDLE:
      return "bad handle";
    case CURLUE_BAD_PARTPOINTER:
      return "bad part pointer";
    case CURLUE_MALFORMED_INPUT:
      return "malformed input";
    case CURLUE_BAD_PORT_NUMBER:
      return "bad port number";
    case CURLUE_UNSUPPORTED_SCHEME:
      return "unsupported scheme";
    case CURLUE_URLDECODE:
      return "urldecode";
    case CURLUE_OUT_OF_MEMORY:
      return "out of memory";
    case CURLUE_USER_NOT_ALLOWED:
      return "user not allowed";
    case CURLUE_UNKNOWN_PART:
      return "unknown part";
    case CURLUE_NO_SCHEME:
      return "no scheme";
    case CURLUE_NO_USER:
      return "no user";
    case CURLUE_NO_PASSWORD:
      return "no password";
    case CURLUE_NO_OPTIONS:
      return "no options";
    case CURLUE_NO_HOST:
      return "no host";
    case CURLUE_NO_PORT:
      return "no port";
    case CURLUE_NO_QUERY:
      return "no query";
    case CURLUE_NO_FRAGMENT:
      return "no fragment";
    default:
      return "unknown error";
  };
}

static void print(const char *str) {
  if (str) {
    printf("\"%s\"", str);
  } else {
    printf("(null)");
  }
}

static void get_and_print(CURLU *h, CURLUPart part, CURLUcode no_part,
                          const char *description) {
  char *str = NULL;
  char *decoded_str = NULL;

  // ==-1 works regardless of CURLUcode is signed or unsigned (unlike <0).
  if (no_part == -1) {
    no_part = CURLUE_UNKNOWN_PART;
  }

  CURLUcode rc = curl_url_get(h, part, &str, 0);
  if (rc == no_part) {
    str = NULL;
  } else if (rc) {
    fprintf(stderr, "Failed to get %s: %s\n", description, url_strerr(rc));
    goto end;
  }

  printf("%s: ", description);
  print(str);

  if (part != CURLUPART_URL && part != CURLUPART_SCHEME &&
      part != CURLUPART_PORT) {
    rc = curl_url_get(h, part, &decoded_str, CURLU_URLDECODE);
    if (rc == no_part) {
      decoded_str = NULL;
    } else if (rc) {
      fprintf(stderr, "Failed to get %s: %s\n", description, url_strerr(rc));
      goto end;
    }
    printf(" (decoded: ");
    print(decoded_str);
    printf(")");
  }

  printf("\n");

end:
  curl_free(str);
  str = NULL;
  curl_free(decoded_str);
  decoded_str = NULL;
}

static void get_and_print_json(struct json_object *obj, CURLU *h,
                               CURLUPart part, CURLUcode no_part,
                               const char *description) {
  char *str = NULL;
  char *decoded_str = NULL;
  char *decoded_key = NULL;

  // ==-1 works regardless of CURLUcode is signed or unsigned (unlike <0).
  if (no_part == -1) {
    no_part = CURLUE_UNKNOWN_PART;
  }

  CURLUcode rc = curl_url_get(h, part, &str, 0);
  if (rc == no_part) {
    str = NULL;
  } else if (rc) {
    fprintf(stderr, "Failed to get %s: %s\n", description, url_strerr(rc));
    goto end;
  }

  add_key(obj, description, str);

  if (part != CURLUPART_URL && part != CURLUPART_SCHEME &&
      part != CURLUPART_PORT) {
    rc = curl_url_get(h, part, &decoded_str, CURLU_URLDECODE);
    if (rc == no_part) {
      decoded_str = NULL;
    } else if (rc) {
      fprintf(stderr, "Failed to get %s: %s\n", description, url_strerr(rc));
      goto end;
    }

    struct string_builder decoded_key_builder =
        new_string_builder(strlen(description) + strlen("_decoded") + 1);
    append_str(&decoded_key_builder, description);
    append_str(&decoded_key_builder, "_decoded");
    decoded_key = release_builder(&decoded_key_builder);
    add_key(obj, decoded_key, decoded_str);
  }

end:
  curl_free(str);
  str = NULL;
  curl_free(decoded_str);
  decoded_str = NULL;
  free(decoded_key);
  decoded_key = NULL;
}

static void print_json(CURLU *h) {
  struct json_object obj = new_json_object();
  get_and_print_json(&obj, h, CURLUPART_URL, -1, "href");
  get_and_print_json(&obj, h, CURLUPART_SCHEME, CURLUE_NO_SCHEME, "scheme");
  get_and_print_json(&obj, h, CURLUPART_USER, CURLUE_NO_USER, "user");
  get_and_print_json(&obj, h, CURLUPART_PASSWORD, CURLUE_NO_PASSWORD,
                     "password");
  get_and_print_json(&obj, h, CURLUPART_OPTIONS, CURLUE_NO_OPTIONS, "options");
  get_and_print_json(&obj, h, CURLUPART_HOST, CURLUE_NO_HOST, "host");
  get_and_print_json(&obj, h, CURLUPART_PORT, CURLUE_NO_PORT, "port");
  get_and_print_json(&obj, h, CURLUPART_PATH, -1, "path");
  get_and_print_json(&obj, h, CURLUPART_QUERY, CURLUE_NO_QUERY, "query");
  get_and_print_json(&obj, h, CURLUPART_FRAGMENT, CURLUE_NO_FRAGMENT,
                     "fragment");
  get_and_print_json(&obj, h, CURLUPART_ZONEID, -1, "zone_id");

  char *json_str = finalize_object(&obj);
  printf("JSON:%s\n", json_str);
  free(json_str);
  json_str = NULL;
}

static void print_help(const char *argv0) {
  fprintf(stderr,
          "Usage: %s [OPTION]... <URL>\n"
          " -b <url> Base URL\n"
          " -e       Encode URL components while parsing\n"
          " -h       Print this help\n",
          argv0);
}

int main(int argc, char *argv[]) {
  // for main() reentrance in WebAssembly
  optind = 1;

  char *base_url = NULL;
  bool encode_url = false;
  bool failed = false;
  CURLU *h = NULL;

  // Disable icky stdout/err buffering.
  setvbuf(stderr, NULL, _IONBF, 0);
  setvbuf(stdout, NULL, _IONBF, 0);

  int opt;
  while ((opt = getopt(argc, argv, "b:eh")) != -1) {
    switch (opt) {
      case 'b':
        free(base_url);
        base_url = strdup(optarg);
        break;
      case 'e':
        encode_url = true;
        break;
      case 'h':
        print_help(argv[0]);
        goto end;
      default:
        print_help(argv[0]);
        failed = true;
        goto end;
    }
  }

  if (optind >= argc) {
    fprintf(stderr, "No URL found\n");
    print_help(argv[0]);
    failed = true;
    goto end;
  }

  const char *url_to_parse = argv[optind];

  // Always enable non-supported scheme, as URL parsing is not affected.
  unsigned int parse_flags = CURLU_NON_SUPPORT_SCHEME;
  if (encode_url) {
    parse_flags |= CURLU_URLENCODE;
  }

  curl_version_info_data *version_data = curl_version_info(CURLVERSION_NOW);
  printf("VERSION:%s\n", version_data->version);

  printf("using %s\n\n", curl_version());

  h = curl_url();
  CURLUcode rc = CURLUE_OK;

  if (base_url) {
    printf("parsing base \"%s\"\n", base_url);
    rc = curl_url_set(h, CURLUPART_URL, base_url, parse_flags);
    if (rc) {
      fprintf(stderr, "Failed to parse base URL: %s\n", url_strerr(rc));
      failed = true;
      goto end;
    }
    printf("\n");
  }

  printf("parsing \"%s\"\n", url_to_parse);
  rc = curl_url_set(h, CURLUPART_URL, url_to_parse, parse_flags);
  if (rc) {
    fprintf(stderr, "Failed to parse URL: %s\n", url_strerr(rc));
    failed = true;
    goto end;
  }

  get_and_print(h, CURLUPART_URL, -1, "roundtripped");
  get_and_print(h, CURLUPART_SCHEME, CURLUE_NO_SCHEME, "scheme");
  get_and_print(h, CURLUPART_USER, CURLUE_NO_USER, "user");
  get_and_print(h, CURLUPART_PASSWORD, CURLUE_NO_PASSWORD, "password");
  get_and_print(h, CURLUPART_OPTIONS, CURLUE_NO_OPTIONS, "options");
  get_and_print(h, CURLUPART_HOST, CURLUE_NO_HOST, "host");
  get_and_print(h, CURLUPART_PORT, CURLUE_NO_PORT, "port");
  get_and_print(h, CURLUPART_PATH, -1, "path");
  get_and_print(h, CURLUPART_QUERY, CURLUE_NO_QUERY, "query");
  get_and_print(h, CURLUPART_FRAGMENT, CURLUE_NO_FRAGMENT, "fragment");
  get_and_print(h, CURLUPART_ZONEID, -1, "zone id");

  print_json(h);

end:
  curl_url_cleanup(h);
  h = NULL;
  free(base_url);
  base_url = NULL;
  return failed ? EXIT_FAILURE : EXIT_SUCCESS;
}
