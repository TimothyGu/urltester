#ifndef JSON_OBJECT_H
#define JSON_OBJECT_H

#include <stdbool.h>

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

// If len < 0, assume str is zero-terminated.
static void json_append_str(struct string_builder *builder, const char *str,
                            ssize_t len) {
  append_char(builder, '"');
  for (ssize_t i = 0; len < 0 ? str[i] != '\0' : i < len; i++) {
    switch (str[i]) {
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
        if ((unsigned char)str[i] < 0x20) {
          append_str(builder, "\\u");
          char buf[10];
          ssize_t hex_len = snprintf(buf, sizeof(buf), "%.4x", str[i]);
          append_mem(builder, buf, hex_len);
        } else {
          append_char(builder, str[i]);
        }
        break;
    }
  }
  append_char(builder, '"');
}

// If value_len < 0, assume value is zero-terminated.
static void add_key(struct json_object *obj, const char *key, const char *value,
                    ssize_t value_len) {
  assert(key);
  if (obj->first) {
    append_char(&obj->builder, '{');
    obj->first = false;
  } else {
    append_char(&obj->builder, ',');
  }
  json_append_str(&obj->builder, key, -1);
  append_char(&obj->builder, ':');
  if (value) {
    json_append_str(&obj->builder, value, value_len);
  } else {
    append_str(&obj->builder, "null");
  }
}

static void free_json_object(struct json_object *obj) {
  free_builder(&obj->builder);
  obj->first = true;
}

static char *finalize_json_object(struct json_object *obj) {
  if (obj->first) {
    append_char(&obj->builder, '{');
    obj->first = false;
  }
  append_char(&obj->builder, '}');
  char *buf = release_builder(&obj->builder);
  obj->first = true;
  return buf;
}

#endif  // JSON_OBJECT_H
