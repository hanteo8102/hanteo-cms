const querySelectorBoard = (category, user) => {
  return `
    select a.*
    from (select boards.id,
                 boards.title,
                 boards.contents,
                 boards.writer,
                 boards.is_delete,
                 boards.category,
                 boards.writing_type,
                 boards.color_type,
                 boards.view_count,
                 boards.created_by,
                 boards.updated_by,
                 boards.created_at,
                 boards.updated_at,
                 0 < (SELECT COUNT(*)
                      FROM block_user_lists
                      WHERE user_id = ${user}
                        AND boards.writer = block_user_id) AS isBlock,
                 (select count(1)
                  from article_elements
                  where boards.id = article_elements.type_id
                    AND type = 'board'
                    AND good = true)                       AS good_count,
                 (select count(1)
                  from article_elements
                  where boards.id = article_elements.type_id
                    AND type = 'board'
                    AND hate = true)                       AS hate_count,
                 (select count(1)
                  from comments
                  where boards.id = comments.type_id
                    AND type = 'board')                    AS comment_count,
                 (select count(1)
                  from re_comments
                  where boards.id = re_comments.type_id
                    AND type = 'board'
                    AND re_comments.is_delete = false)                    AS re_comment_count,
                 U.nick_name
          from boards
                 INNER JOIN "users-permissions_user" AS U ON (boards.writer = U.id)
          WHERE boards.is_delete = false
            AND boards.writing_type != N'일반 게시물'
            AND boards.category = ${category}
          ORDER BY boards.created_at DESC
          OFFSET 0 LIMIT 20) as a
    UNION ALL
    select b.*
    from (select boards.id,
                 CASE
                   WHEN 0 < (SELECT COUNT(*)
                             FROM block_user_lists
                             WHERE user_id = ${user}
                               AND boards.writer = block_user_id)
                     THEN N'차단된 멤버의 게시글입니다.'
                   ELSE boards.title
                   END                                     AS title,
                 CASE
                   WHEN 0 < (SELECT COUNT(*)
                             FROM block_user_lists
                             WHERE user_id = ${user}
                               AND boards.writer = block_user_id)
                     THEN ''
                   ELSE boards.contents
                   END                                     AS contents,
                 boards.writer,
                 boards.is_delete,
                 boards.category,
                 boards.writing_type,
                 boards.color_type,
                 boards.view_count,
                 boards.created_by,
                 boards.updated_by,
                 boards.created_at,
                 boards.updated_at,
                 0 < (SELECT COUNT(*)
                      FROM block_user_lists
                      WHERE user_id = ${user}
                        AND boards.writer = block_user_id) AS isBlock,
                 (select count(1)
                  from article_elements
                  where boards.id = article_elements.type_id
                    AND type = 'board'
                    AND good = true)                       AS good_count,
                 (select count(1)
                  from article_elements
                  where boards.id = article_elements.type_id
                    AND type = 'board'
                    AND hate = true)                       AS hate_count,
                 (select count(1)
                  from comments
                  where boards.id = comments.type_id
                    AND type = 'board')                    AS comment_count,
                 (select count(1)
                  from re_comments
                  where boards.id = re_comments.type_id
                    AND type = 'board'
                    AND re_comments.is_delete = false)                    AS re_comment_count,
                 U.nick_name
          from boards
                 INNER JOIN "users-permissions_user" AS U ON (boards.writer = U.id)
          WHERE boards.is_delete = false
            AND boards.writing_type = N'일반 게시물'
            AND boards.category = ${category}
          ORDER BY boards.created_at DESC
          OFFSET 0 LIMIT 20) as b
  `
}

const handleCountBoard = (category) => {
  return `
    SELECT COUNT(*)
    FROM boards
    WHERE boards.is_delete = FALSE
      AND boards.writing_type = N'일반 게시물'
      AND boards.category = ${category}`
}

// -------------------------------------------------------------------------------------- //

const querySelectorUserContentsBoard = (user) => {
  return `
    SELECT boards.*,
           (SELECT count(1)
            FROM article_elements
            WHERE boards.id = article_elements.type_id
              AND type = 'board'
              AND good = true)    AS good_count,
           (SELECT count(1)
            FROM article_elements
            WHERE boards.id = article_elements.type_id
              AND type = 'board'
              AND hate = true)    AS hate_count,
           (SELECT count(1)
            FROM comments
            WHERE boards.id = comments.type_id
              AND type = 'board') AS comment_count,
           (SELECT count(1)
            FROM re_comments
            WHERE boards.id = re_comments.type_id
              AND type = 'board'
              AND re_comments.is_delete = false) AS re_comment_count,
           U.nick_name
    FROM boards
           INNER JOIN "users-permissions_user" AS U ON (boards.writer = U.id)
    WHERE boards.is_delete = false
      AND boards.writing_type = N'일반 게시물'
      AND boards.writer = ${user}
    ORDER BY boards.created_at DESC
    OFFSET 0 LIMIT 15
  `
}

const handleCountUserContentsBoard = (user) => {
  return `
    SELECT COUNT(*)
    FROM boards
    WHERE boards.is_delete = FALSE
      AND boards.writing_type = N'일반 게시물'
      AND boards.writer = ${user}
  `
}

// -------------------------------------------------------------------------------------- //

const querySelectorUserContentsComment = (user) => {
  return `
    SELECT comments.*,
           (SELECT COUNT(1)
            FROM article_elements
            WHERE comments.id = article_elements.type_id
              AND type = 'comment'
              AND good = true)                       AS good_count,
           (SELECT COUNT(1)
            FROM article_elements
            WHERE comments.id = article_elements.type_id
              AND type = 'comment'
              AND hate = false)                      AS hate_count,
           (SELECT COUNT(1)
            FROM re_comments
            WHERE comments.id = re_comments.comment AND re_comments.is_delete = false) AS re_comment_count,
           U.nick_name,
           CASE
             WHEN comments.type = 'news' then 0
             WHEN comments.type = 'board'
               THEN (SELECT category
                     FROM boards st1
                     WHERE st1.id = comments.type_id)
             END                                     AS category,
           CASE
             WHEN comments.type = 'news' then 0
             WHEN comments.type = 'board'
               THEN (SELECT view_count
                     FROM boards st1
                     WHERE st1.id = comments.type_id)
             END                                     AS view_count,
           (SELECT CAST(count(1) AS INT)
            FROM comments
            WHERE comments.is_delete = false
              AND comments.writer = ${user})         AS total_count
    FROM comments
           INNER JOIN "users-permissions_user" AS U ON (comments.writer = U.id)
    WHERE comments.is_delete = false
      AND comments.writer = ${user}
    ORDER BY comments.created_at DESC
    OFFSET 0 LIMIT 15
  `
}

const handleCountUserContentsComment = (user) => {
  return `
    SELECT COUNT(*)
    FROM comments
    WHERE comments.is_delete = false
      AND comments.writer = ${user}
  `
}

// -------------------------------------------------------------------------------------- //

const querySelectorUserContentsGood = (user) => {
  return `
    SELECT DISTINCT id,
                    type,
                    category,
                    title,
                    created_at,
                    view_count,
                    good_count,
                    (comment_count + re_comment_count) AS comment_count
    FROM (SELECT id
               , 'board'                     AS type
               , t1.category                 AS category
               , title
               , created_at
               , view_count
               , (SELECT COUNT(*)
                  FROM article_elements st1
                  WHERE st1.type = 'board'
                    AND st1.type_id = t1.id
                    AND good = true)         AS good_count
               , (SELECT COUNT(*)
                  FROM comments st1
                  WHERE st1.type = 'board'
                    AND st1.type_id = t1.id) AS comment_count
               , (SELECT COUNT(*)
                  FROM re_comments st1
                  WHERE st1.type = 'board'
                    AND st1.type_id = t1.id
                    AND st1.is_delete = false) AS re_comment_count
          FROM boards t1
          WHERE id IN
                (SELECT type_id
                 FROM article_elements
                 WHERE type = 'board'
                   AND good = true
                   AND writer = ${user})
          UNION ALL
          SELECT id
               , 'news'                      AS type
               , 0                           AS category
               , title
               , created_at
               , view_count
               , (SELECT COUNT(*)
                  FROM article_elements st1
                  WHERE st1.type = 'news'
                    AND st1.type_id = t1.id
                    AND good = true)         AS good_count
               , (SELECT COUNT(*)
                  FROM comments st1
                  WHERE st1.type = 'news'
                    AND st1.type_id = t1.id) AS comment_count
               , (SELECT COUNT(*)
                  FROM re_comments st1
                  WHERE st1.type = 'news'
                    AND st1.type_id = t1.id
                    AND st1.is_delete = false) AS re_comment_count
          FROM news_contents t1
          WHERE id IN (SELECT type_id
                       FROM article_elements
                       WHERE type = 'news'
                         AND good = true
                         AND writer = ${user})
          UNION ALL
          SELECT t1.id
               , 'board'                     AS type
               , t1.category                 AS category
               , t1.title
               , t1.created_at
               , t1.view_count
               , (SELECT COUNT(*)
                  FROM article_elements st1
                  WHERE st1.type = 'board'
                    AND st1.type_id = t1.id
                    AND good = true)         AS good_count
               , (SELECT COUNT(*)
                  FROM comments st1
                  WHERE st1.type = 'board'
                    AND st1.type_id = t1.id) AS comment_count
               , (SELECT COUNT(*)
                  FROM re_comments st1
                  WHERE st1.type = 'board'
                    AND st1.type_id = t1.id
                    AND st1.is_delete = false) AS re_comment_count
          FROM boards t1
                 INNER JOIN comments t2 ON t1.id = t2.type_id AND t2.type = 'board'
          WHERE t2.id IN (SELECT type_id
                          FROM article_elements t3
                          WHERE type = 'comment'
                            AND good = true
                            AND writer = ${user})
          UNION ALL
          SELECT t1.id
               , 'news'                      AS type
               , 0                           AS category
               , t1.title
               , t1.created_at
               , t1.view_count
               , (SELECT COUNT(*)
                  FROM article_elements st1
                  WHERE st1.type = 'news'
                    AND st1.type_id = t1.id
                    AND good = true)         AS good_count
               , (SELECT COUNT(*)
                  FROM comments st1
                  WHERE st1.type = 'news'
                    AND st1.type_id = t1.id) AS comment_count
               , (SELECT COUNT(*)
                  FROM re_comments st1
                  WHERE st1.type = 'news'
                    AND st1.type_id = t1.id
                    AND st1.is_delete = false) AS re_comment_count
          FROM news_contents t1
                 INNER JOIN comments t2 ON t1.id = t2.type_id AND t2.type = 'news'
          WHERE t2.id IN (SELECT type_id
                          FROM article_elements t3
                          WHERE type = 'comment'
                            AND good = true
                            AND writer = ${user})) AS a
    ORDER BY created_at DESC
    OFFSET 0 LIMIT 15
  `
}

const handleCountUserContentsGood = (user) => {
  return `
    SELECT COUNT(*)
    FROM (SELECT DISTINCT id,
                          type,
                          category,
                          title,
                          created_at,
                          view_count,
                          good_count,
                          (comment_count + re_comment_count) AS comment_count
          FROM (SELECT id
                     , 'board'                     AS type
                     , t1.category                 AS category
                     , title
                     , created_at
                     , view_count
                     , (SELECT COUNT(*)
                        FROM article_elements st1
                        WHERE st1.type = 'board'
                          AND st1.type_id = t1.id
                          AND good = true)         AS good_count
                     , (SELECT COUNT(*)
                        FROM comments st1
                        WHERE st1.type = 'board'
                          AND st1.type_id = t1.id) AS comment_count
                     , (SELECT COUNT(*)
                        FROM re_comments st1
                        WHERE st1.type = 'board'
                          AND st1.type_id = t1.id
                          AND st1.is_delete = false) AS re_comment_count
                FROM boards t1
                WHERE id IN
                      (SELECT type_id
                       FROM article_elements
                       WHERE type = 'board'
                         AND good = true
                         AND writer = ${user})
                UNION ALL
                SELECT id
                     , 'news'                      AS type
                     , 0                           AS category
                     , title
                     , created_at
                     , view_count
                     , (SELECT COUNT(*)
                        FROM article_elements st1
                        WHERE st1.type = 'news'
                          AND st1.type_id = t1.id
                          AND good = true)         AS good_count
                     , (SELECT COUNT(*)
                        FROM comments st1
                        WHERE st1.type = 'news'
                          AND st1.type_id = t1.id) AS comment_count
                     , (SELECT COUNT(*)
                        FROM re_comments st1
                        WHERE st1.type = 'news'
                          AND st1.type_id = t1.id
                          AND st1.is_delete = false) AS re_comment_count
                FROM news_contents t1
                WHERE id IN (SELECT type_id
                             FROM article_elements
                             WHERE type = 'news'
                               AND good = true
                               AND writer = ${user})
                UNION ALL
                SELECT t1.id
                     , 'board'                     AS type
                     , t1.category                 AS category
                     , t1.title
                     , t1.created_at
                     , t1.view_count
                     , (SELECT COUNT(*)
                        FROM article_elements st1
                        WHERE st1.type = 'board'
                          AND st1.type_id = t1.id
                          AND good = true)         AS good_count
                     , (SELECT COUNT(*)
                        FROM comments st1
                        WHERE st1.type = 'board'
                          AND st1.type_id = t1.id) AS comment_count
                     , (SELECT COUNT(*)
                        FROM re_comments st1
                        WHERE st1.type = 'board'
                          AND st1.type_id = t1.id
                          AND st1.is_delete = false) AS re_comment_count
                FROM boards t1
                       INNER JOIN comments t2 ON t1.id = t2.type_id AND t2.type = 'board'
                WHERE t2.id IN (SELECT type_id
                                FROM article_elements t3
                                WHERE type = 'comment'
                                  AND good = true
                                  AND writer = ${user})
                UNION ALL
                SELECT t1.id
                     , 'news'                      AS type
                     , 0                           AS category
                     , t1.title
                     , t1.created_at
                     , t1.view_count
                     , (SELECT COUNT(*)
                        FROM article_elements st1
                        WHERE st1.type = 'news'
                          AND st1.type_id = t1.id
                          AND good = true)         AS good_count
                     , (SELECT COUNT(*)
                        FROM comments st1
                        WHERE st1.type = 'news'
                          AND st1.type_id = t1.id) AS comment_count
                     , (SELECT COUNT(*)
                        FROM re_comments st1
                        WHERE st1.type = 'news'
                          AND st1.type_id = t1.id
                          AND st1.is_delete = false) AS re_comment_count
                FROM news_contents t1
                       INNER JOIN comments t2 ON t1.id = t2.type_id AND t2.type = 'news'
                WHERE t2.id IN (SELECT type_id
                                FROM article_elements t3
                                WHERE type = 'comment'
                                  AND good = true
                                  AND writer = ${user})) AS aa) AS a
  `
}

// -------------------------------------------------------------------------------------- //

const querySelectorUserContentsScrap = (user) => {
  return `
    SELECT DISTINCT id,
                    type,
                    category,
                    title,
                    created_at,
                    view_count,
                    good_count,
                    (comment_count + re_comment_count) AS comment_count
    FROM (SELECT id
               , 'board'                     AS type
               , t1.category                 AS category
               , title
               , created_at
               , view_count
               , (SELECT COUNT(*)
                  FROM article_elements st1
                  WHERE st1.type = 'board'
                    AND st1.type_id = t1.id
                    AND scrap = true)        AS good_count
               , (SELECT COUNT(*)
                  FROM comments st1
                  WHERE st1.type = 'board'
                    AND st1.type_id = t1.id) AS comment_count
               , (SELECT COUNT(*)
                  FROM re_comments st1
                  WHERE st1.type = 'board'
                    AND st1.type_id = t1.id
                    AND st1.is_delete = false) AS re_comment_count
          FROM boards t1
          WHERE id IN
                (SELECT type_id
                 FROM article_elements
                 WHERE type = 'board'
                   AND scrap = true
                   AND writer = ${user})
          UNION ALL
          SELECT id
               , 'news'                      AS type
               , 0                           AS category
               , title
               , created_at
               , view_count
               , (SELECT COUNT(*)
                  FROM article_elements st1
                  WHERE st1.type = 'news'
                    AND st1.type_id = t1.id
                    AND scrap = true)        AS good_count
               , (SELECT COUNT(*)
                  FROM comments st1
                  WHERE st1.type = 'news'
                    AND st1.type_id = t1.id) AS comment_count
               , (SELECT COUNT(*)
                  FROM re_comments st1
                  WHERE st1.type = 'news'
                    AND st1.type_id = t1.id
                    AND st1.is_delete = false) AS re_comment_count
          FROM news_contents t1
          WHERE id IN (SELECT type_id
                       FROM article_elements
                       WHERE type = 'news'
                         AND scrap = true
                         AND writer = ${user})) AS a
    ORDER BY created_at DESC
    OFFSET 0 LIMIT 15
  `
}

const handleCountUserContentsScrap = (user) => {
  return `
    SELECT COUNT(*)
    FROM (SELECT DISTINCT id,
                          type,
                          category,
                          title,
                          created_at,
                          view_count,
                          good_count,
                          (comment_count + re_comment_count) AS comment_count
          FROM (SELECT id
                     , 'board'                     AS type
                     , t1.category                 AS category
                     , title
                     , created_at
                     , view_count
                     , (SELECT COUNT(*)
                        FROM article_elements st1
                        WHERE st1.type = 'board'
                          AND st1.type_id = t1.id
                          AND scrap = true)        AS good_count
                     , (SELECT COUNT(*)
                        FROM comments st1
                        WHERE st1.type = 'board'
                          AND st1.type_id = t1.id) AS comment_count
                     , (SELECT COUNT(*)
                        FROM re_comments st1
                        WHERE st1.type = 'board'
                          AND st1.type_id = t1.id
                          AND st1.is_delete = false) AS re_comment_count
                FROM boards t1
                WHERE id IN
                      (SELECT type_id
                       FROM article_elements
                       WHERE type = 'board'
                         AND scrap = true
                         AND writer = ${user})
                UNION ALL
                SELECT id
                     , 'news'                      AS type
                     , 0                           AS category
                     , title
                     , created_at
                     , view_count
                     , (SELECT COUNT(*)
                        FROM article_elements st1
                        WHERE st1.type = 'news'
                          AND st1.type_id = t1.id
                          AND scrap = true)        AS good_count
                     , (SELECT COUNT(*)
                        FROM comments st1
                        WHERE st1.type = 'news'
                          AND st1.type_id = t1.id) AS comment_count
                     , (SELECT COUNT(*)
                        FROM re_comments st1
                        WHERE st1.type = 'news'
                          AND st1.type_id = t1.id
                          AND st1.is_delete = false) AS re_comment_count
                FROM news_contents t1
                WHERE id IN (SELECT type_id
                             FROM article_elements
                             WHERE type = 'news'
                               AND scrap = true
                               AND writer = ${user})) AS aa) AS a
  `
}

// -------------------------------------------------------------------------------------- //

module.exports = {
  querySelectorBoard,
  handleCountBoard,
  querySelectorUserContentsBoard,
  handleCountUserContentsBoard,
  querySelectorUserContentsComment,
  handleCountUserContentsComment,
  querySelectorUserContentsGood,
  handleCountUserContentsGood,
  querySelectorUserContentsScrap,
  handleCountUserContentsScrap,
}
